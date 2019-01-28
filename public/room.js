const { pathname, href } = window.location;
let room = pathname.replace("/", "");
let username;

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
  const submitMsg = document.querySelector(".submitMsg");
  const handleChat = document.querySelector(".handleChat");
  const msgConsole = document.querySelector(".console");
  const roomURL = document.querySelector(".roomURL");
  const copyURL = document.querySelector(".copyURL");
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

  // const { pathname, href } = window.location;
  // let room = pathname.replace("/", "");
  // let username;

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
    let callImg = document.createElement("IMG");
    callImg.src = "/images/darkgrey_call_end_2x.png";
    callImg.style.padding = "0 10px";
    waiting.innerText = "";
    waiting.style.fontSize = "24px";
    var beginText = document.createTextNode("Press");
    var endText = document.createTextNode("to connect.");
    waiting.appendChild(beginText);
    waiting.appendChild(callImg);
    waiting.appendChild(endText);
    document.querySelector(".infoContainer").style.display = "none";
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

  function handleToolTip(target, initial = false) {
    let tool = target.dataset.tool;
    target.children[1].style.display = "block";
    if (tool === "audio") {
      if (target.dataset.active === "true") {
        target.children[1].innerText = "Turn audio off";
      } else {
        target.children[1].innerText = "Turn audio on";
      }
    } else if (tool === "video") {
      if (target.dataset.active === "true") {
        target.children[1].innerText = "Turn video off";
      } else {
        target.children[1].innerText = "Turn video on";
      }
    } else if (tool === "chat") {
      if (target.dataset.active === "true") {
        target.children[1].innerText = "Open chat";
      } else {
        target.children[1].innerText = "Close chat";
      }
    }
  }

  [handleAudio, handleVideo, handleChat].forEach((button, idx) => {
    button.addEventListener("click", e => {
      let btnCtrl;
      let currentSrc = e.currentTarget.children[0].src;
      button.dataset.active =
        button.dataset.active === "true" ? "false" : "true";

      if (idx === 2) {
        msgConsole.classList.toggle("show");
      } else {
        btnCtrl = localVideo.srcObject.getTracks()[idx].enabled;
        localVideo.srcObject.getTracks()[idx].enabled = !btnCtrl;
      }

      if (btnCtrl && idx !== 2) {
        e.currentTarget.children[0].src = currentSrc.replace("darkgrey", "red");
      } else if (!btnCtrl && idx !== 2) {
        e.currentTarget.children[0].src = currentSrc.replace("red", "darkgrey");
      }

      handleToolTip(e.currentTarget);
    });
  });

  handleChat.click();
  handleChat.children[1].style.display = "none";

  document.querySelectorAll(".controlWrapper button").forEach(btn => {
    btn.addEventListener("mouseenter", e => {
      handleToolTip(e.currentTarget);
    });
  });

  document.querySelectorAll(".controlWrapper button").forEach(btn => {
    btn.addEventListener("mouseleave", e => {
      e.currentTarget.children[1].style.display = "none";
    });
  });

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

  socket.on("messages", function(data) {
    let msg = `You: ${data.msg}`;
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
    const msg = msgInput.value;
    msgInput.value = "";
    newMessage(`Me: ${msg}`);
    socket.emit("messages", { msg, room, username });
  }

  msgInput.addEventListener("keypress", function(e) {
    if (e.key == "Enter") {
      handleMessage(e);
    }
  });

  submitMsg.addEventListener("click", function(e) {
    handleMessage(e);
  });

  // Copy URL / Send Email URL

  roomURL.value = href;

  function copy() {
    roomURL.select();
    document.execCommand("copy");
  }

  copyURL.addEventListener("click", e => {
    e.stopPropagation();
    copy();
    anime
      .timeline()
      .add({
        targets: ".copyFlag",
        opacity: [0, 1],
        duration: 300,
        easing: "easeInOutCubic"
      })
      .add({
        targets: ".copyFlag",
        opacity: [1, 0],
        offset: "+=2000",
        duration: 1000,
        easing: "easeInOutCubic"
      });
  });

  document.querySelector(".submitEmail").addEventListener("click", () => {
    const email = document.getElementById("enterEmail");
    socket.emit("pass email", { email: email.value, url: href });
    email.value = "";
  });
});
