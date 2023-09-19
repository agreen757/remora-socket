// Put all your frontend code here.
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("서버와 연결되었습니다");
});
