const startContainer = document.querySelector(".startContainer");

startContainer.addEventListener("click", () => {
  fetch("/", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(res => {
      console.log(res);
      window.location.href = res.roomURL;
    })
    .catch(err => {
      console.log(err);
    });
});
