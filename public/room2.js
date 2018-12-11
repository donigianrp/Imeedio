document.addEventListener("DOMContentLoaded", function(event) {
  const localVideo = document.querySelector(".localVideo");
  const localVidContainer = document.querySelector(".vidContainer");
  const videoDisplay = document.querySelector(".videoDisplay");
  const callBtn = document.querySelector(".callBtn");
  const endStream = document.querySelector(".endStream");
  const handleAudio = document.querySelector(".handleAudio");
  const handleVideo = document.querySelector(".handleVideo");
  const settings = document.querySelector(".settings");
  const settingsOptions = document.querySelector(".settingsOptions");
  const screenSplit = document.querySelector(".screenSplit");
  const screenMin = document.querySelector(".screenMin");
  const screenMax = document.querySelector(".screenMax");
  const placeholder = document.querySelector(".placeholder");
  const waiting = document.querySelector(".waiting");
  const msgInput = document.querySelector("#msgInput");
  const messages = document.querySelector(".messages");
  const handleChat = document.querySelector(".handleChat");
  const msgConsole = document.querySelector(".console");
  let remoteVideo;
  let remoteVidContainer;
  let localSetting = "secondary";
  let localStream;
  let pc;
  const socket = io();
  const mediaConstraints = {
    audio: true,
    video: true
  };
  const ICE_SERVERS = {
    iceServers: [
      {
        url: "stun:stun.l.google.com:19302"
      },
      {
        url: "stun:stun.skyway.io:3478"
      },
      {
        url: "stun:iphone-stun.strato-iphone.de:3478"
      }
    ]
  };
  const { pathname } = window.location;
  let room = pathname.replace("/", "");
  let username;
  console.log(room);

  function createRemote() {
    placeholder.parentNode.removeChild(placeholder);

    remoteVidContainer = document.createElement("DIV");
    remoteVidContainer.classList.add("vidContainer");
    remoteVidContainer.dataset.view = "containerHalf";

    let vidSmallContainer = document.createElement("DIV");
    vidSmallContainer.classList.add("vidSmallContainer");

    remoteVideo = document.createElement("VIDEO");
    remoteVideo.setAttribute("autoplay", "true");
    remoteVideo.setAttribute("playsinline", "true");
    remoteVideo.classList.add("remoteVideo");
    remoteVideo.dataset.view = "half";

    remoteVidContainer.appendChild(vidSmallContainer);
    vidSmallContainer.appendChild(remoteVideo);
    handleDisplaySwap();

    return remoteVidContainer;
  }

  function sendToServer(dataObj) {
    socket.emit("send-data", { dataObj, room });
  }

  function setup(isCaller = true) {
    localVidContainer.dataset.view = "containerHalf";
    localVideo.dataset.view = "half";

    videoDisplay.appendChild(createRemote());
    endStream.classList.add("show");
    settings.classList.add("show");

    let msgChildren = messages.children.length;
    for (let i = 0; i < msgChildren; i++) {
      messages.removeChild(messages.lastChild);
    }

    pc = new RTCPeerConnection(ICE_SERVERS);
    window.myPeerConnection = pc;
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleRemoteStream;

    localStream.getTracks().forEach(track => {
      console.log("adding local tracks", track);
      pc.addTrack(track, localStream);
    });

    if (isCaller) {
      callBtn.classList.remove("show");
      endStream.classList.add("show");
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() =>
          sendToServer({
            type: "video-offer",
            sdp: pc.localDescription
          })
        )
        .catch(err => console.log(err));
    }
  }

  function handleIceCandidate(event) {
    if (event.candidate != null) {
      sendToServer({
        ice: event.candidate
      });
    }
  }

  function handleRemoteStream(event) {
    console.log("handleRemoteStream", event);
    remoteVideo.srcObject = event.streams[0];
  }

  // Set username / handle connection stage UI
  fetch("/rooms")
    .then(res => res.json())
    .then(data => {
      console.log(data);
      // username = data[room].length === 0 ? "Host" : "Guest";
      // if (username === "Guest") {
      //   waiting.innerText = "waiting for connection...";
      // }
    });

  // Create Local Video/Audio Stream

  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
    })
    .catch(err => console.log(err));

  // Connection Settings

  socket.emit("setSocketId", { room: room });
  socket.on("call button", () => {
    waiting.innerText = "press call to connect...";
    callBtn.classList.add("show");
  });

  socket.on("receive-data", function(data) {
    if (!pc) {
      setup(false);
    }

    console.log("data from peer", data);
    if (data.sdp) {
      const remoteSDP = new RTCSessionDescription(data.sdp);
      pc.setRemoteDescription(remoteSDP).then(() => {
        if (pc.remoteDescription.type == "offer") {
          pc.createAnswer()
            .then(answer => pc.setLocalDescription(answer))
            .then(() =>
              sendToServer({
                type: "video-answer",
                sdp: pc.localDescription
              })
            )
            .catch(err => console.log(err));
        }
      });
    } else if (data.ice) {
      console.log("addIceCandidate", data.ice);
      let iceCandidate = new RTCIceCandidate(data.ice);
      pc.addIceCandidate(iceCandidate).catch(err => console.log(err));
    }
  });

  socket.on("too-many-users", data => {
    console.log(data.error);
    callBtn.disabled = true;
  });

  callBtn.addEventListener("click", () => {
    setup();
  });

  // Disconnection Settings

  endStream.addEventListener("click", () => {
    let stream = localVideo.srcObject;
    let remoteStream = remoteVideo.srcObject;
    let tracks = stream.getTracks();
    let remoteTracks = remoteStream.getTracks();

    tracks.forEach(track => track.stop());
    remoteTracks.forEach(track => track.stop());

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    document.body.style.backgroundColor = "black";
    newMessage("Call has ended.");
  });

  // Toggle Video & Audio Settings

  [handleAudio, handleVideo, handleChat].forEach((button, idx) => {
    let strikeClass;
    if (idx === 0) {
      strikeClass = ".handleAudio .strike";
    } else if (idx === 1) {
      strikeClass = ".handleVideo .strike";
    } else {
      strikeClass = ".handleChat .strike";
    }
    button.addEventListener("click", () => {
      let btnCtrl;
      if (idx === 2) {
        btnCtrl = handleChat.children.length === 1;
      } else {
        btnCtrl = localVideo.srcObject.getTracks()[idx].enabled;
      }

      if (btnCtrl) {
        let strike = document.createElement("DIV");
        strike.classList.add("strike");
        button.appendChild(strike);

        button.style.backgroundColor = "#666";
        button.style.color = "#d3373f";
        button.style.marginTop = "4px";
        button.style.boxShadow = "none";
      } else {
        let strike = document.querySelector(strikeClass);
        strike.parentNode.removeChild(strike);

        button.style.backgroundColor = "#6e78fc";
        button.style.color = "#fff";
        button.style.marginTop = "3px";
        button.style.boxShadow = "1px 1px 2px #000";
        button.classList.remove("strike");
      }
      if (idx !== 2) {
        localVideo.srcObject.getTracks()[idx].enabled = !btnCtrl;
      } else {
        msgConsole.classList.toggle("show");
      }
    });
  });

  handleChat.click();

  // Visual Display Settings

  const displaySettings = {
    max(vidA, vidB) {
      vidA[0].dataset.view = "containerMax";
      vidA[1].dataset.view = "max";
      vidB[0].dataset.view = "containerNone";
      vidB[1].dataset.view = "none";
    },
    half(vidA, vidB) {
      vidA[0].dataset.view = "containerHalf";
      vidA[1].dataset.view = "half";
      vidB[0].dataset.view = "containerHalf";
      vidB[1].dataset.view = "half";
    },
    min(vidA, vidB) {
      vidA[0].dataset.view = "containerMax";
      vidA[1].dataset.view = "max";
      vidB[0].dataset.view = "containerMin";
      vidB[1].dataset.view = "min";
    }
  };

  function handleDisplaySwap() {
    [
      [localVidContainer, localVideo],
      [remoteVidContainer, remoteVideo]
    ].forEach((display, idx, arr) => {
      let altDisplay = idx === 0 ? arr[1] : arr[0];
      display[0].addEventListener("click", () => {
        settingsOptions.classList.remove("visible");
        localSetting = localSetting === "secondary" ? "primary" : "secondary";
        if (display[0].dataset.view === "containerMin") {
          display[0].dataset.view = "containerMax";
          display[1].dataset.view = "max";
          altDisplay[0].dataset.view = "containerMin";
          altDisplay[1].dataset.view = "min";
        }
      });
    });
  }

  function handleSettingOptions(option, func) {
    option.addEventListener("click", e => {
      e.stopPropagation();
      settingsOptions.classList.remove("visible");
      if (localSetting === "secondary") {
        func(
          [remoteVidContainer, remoteVideo],
          [localVidContainer, localVideo]
        );
      } else {
        func(
          [localVidContainer, localVideo],
          [remoteVidContainer, remoteVideo]
        );
      }
    });
  }

  settings.addEventListener("click", () => {
    settingsOptions.classList.toggle("visible");
  });

  handleSettingOptions(screenMin, displaySettings.min);
  handleSettingOptions(screenSplit, displaySettings.half);
  handleSettingOptions(screenMax, displaySettings.max);

  // Chatbox Settings

  socket.on("messages", function(msg) {
    newMessage(msg);
  });

  function newMessage(msg) {
    let newMsg = document.createElement("LI");
    newMsg.innerText = msg;
    messages.appendChild(newMsg);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleMessage(event) {
    if (msgInput.value === "") return;
    const msg = `${username}: ${msgInput.value}`;
    msgInput.value = "";
    newMessage(msg);
    socket.emit("messages", { msg, room });
  }

  msgInput.addEventListener("keypress", function(e) {
    if (e.key == "Enter") {
      handleMessage(e);
    }
  });
});
