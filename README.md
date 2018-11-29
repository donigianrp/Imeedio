# Imeedio

#### Functionality

Imeedio provides real-time audio and video communication between 2 participants. Based on WebRTC's peer-to-peer in browser platform Imeedio handles signaling and connection agreement. The app also provides in chat real-time text communication with the use of Socket.io. Currently Immedio is only available on desktop browsers. Mobile capability will be a feature added in the future.

#### How to use

There are 2 participants, the host and the guest. The host will begin by navigating to the landing page at [https://imeedio.herokuapp.com](https://imeedio.herokuapp.com).  
 - Clicking "start" will create a custom room. The host will be provided a shareable url and a button to enter.  
 - They may share that room link to the guest in any manner they want (ex: email). Host must enter room and wait for guest to appear.  
 - Guest will navigate to room through the url and be prompted to hit the "call" button. This will initiate chat.

#### Features

There are 5 action buttons provided. An audio toggle, video toggle, terminate call, display settings, chat box toggle.

The user may also toggle which view box they appear in by clicking the "local" video display.

#### Tech

Immedio uses a number of open source projects to work properly:

- Vanilla JS - creates dynamic content
- WebRTC - real-time media stream transferring platform
- Socket.io - real-time data transferring library
- Anime.js - animation library
- Node.js - evented I/O for the backend
- Express - fast node.js network app framework
