document.addEventListener("DOMContentLoaded", () => {
  const border = document.querySelector(".border");
  const stage1 = document.querySelector(".stage1");
  const roomURL = document.querySelector(".roomURL");
  const enterContainer = document.querySelector(".enterContainer");
  const marker = document.querySelector(".marker");
  const markerText = document.querySelector(".markerText");
  let room;

  function generateRoomID() {
    return (
      Math.random()
        .toString(36)
        .substring(2, 10) +
      Date.now() +
      Math.random()
        .toString(36)
        .substring(2, 10)
    );
  }

  function animation() {
    anime
      .timeline()
      .add({
        targets: ".contentContainer",
        marginTop: "300px",
        border: "0px",
        height: "100px",
        width: "100px",
        borderRadius: ["100px", "50px"],
        duration: 1000,
        easing: "easeInOutCubic"
      })
      .add({
        targets: ".contentContainer",
        backgroundColor: "#000",
        width: "600px",
        borderRadius: ["50px", "5px"],
        duration: 1200,
        easing: "easeInOutCubic"
      })
      .add({
        targets: ".contentContainer",
        borderRadius: ["5px", "5px"],
        height: "190px",
        duration: 400,
        easing: "easeInOutCubic"
      })
      .add({
        targets: ".stage2",
        borderRadius: ["0px", "5px"],
        margin: "0px",
        opacity: [0, 1]
      })
      .add({
        targets: ".roomURL",
        opacity: [0, 1],
        scale: [0.8, 1]
      })
      .add({
        targets: ".directions",
        opacity: [0, 1],
        scale: [0.8, 1],
        offset: "-=1000"
      })
      .add({
        targets: ".marker",
        opacity: [0, 1]
      })
      .add({
        targets: ".enter",
        opacity: [0, 1],
        duration: 300,
        easing: "easeInOutCubic"
      });

    anime({
      targets: ".directions",
      scale: [0.8, 1.0],
      direction: "alternate",
      duration: 1000,
      easing: "linear",
      loop: true
    });
  }

  anime({
    targets: ".border",
    rotateZ: 360,
    duration: 8000,
    easing: "linear",
    loop: true
  });

  stage1.addEventListener("click", () => {
    room = generateRoomID();
    let roomData = { room };
    roomURL.value = `https://imeedio.herokuapp.com/${room}`;
    enterContainer.href = `/${room}`;
    border.parentNode.removeChild(border);
    stage1.style.display = "none";

    fetch("/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(roomData)
    })
      .then(res => res.json())
      .then(() => {
        animation();
      })
      .catch(err => {
        console.log(err);
      });
  });

  function copy() {
    roomURL.select();
    document.execCommand("copy");
  }

  roomURL.addEventListener("click", e => {
    e.stopPropagation();
    console.log(roomURL.value);
    marker.classList.replace("marker", "copied");
    markerText.innerText = "copied!";
    markerText.style.marginTop = "65px";
    copy();
  });
});
