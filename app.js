// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, collection,
  getDocs, onSnapshot, query, orderBy,
  addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase, ref, onDisconnect, onValue, set,
  serverTimestamp as rtdbTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyARe1Ukdl14YdckbJkokGeTbi1U-mEp3KQ",
  authDomain: "chatappcloud-60b2e.firebaseapp.com",
  projectId: "chatappcloud-60b2e",
  storageBucket: "chatappcloud-60b2e.appspot.com",
  messagingSenderId: "769549781555",
  appId: "1:769549781555:web:175697a1e867d5eb62f146"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account'
});
const storage = getStorage(app);

let currentUser = null;
let selectedUser = null;
let selectedRoom = null;
let unsubscribeMessages = null;

const loginBtn = document.getElementById("login-btn");
const userInfoDiv = document.getElementById("user-info");
const userList = document.getElementById("user-list");
const input = document.getElementById("message-input");
const userIcon = document.querySelector(".nav_user");

loginBtn.addEventListener("click", () => {
  if (currentUser) {
    signOut(auth);
  } else {
    signInWithPopup(auth, provider)
      .then((result) => console.log("Signed in:", result.user))
      .catch((error) => console.error("Sign-in error:", error));
  }
});

userIcon.addEventListener("click", () => {
  if (!currentUser) {
    alert("Vui lòng đăng nhập với Google để xem thông tin.");
  } else {
    modalContent.innerHTML = `
      <div style="text-align:center">
        <img src="${currentUser.photoURL}" alt="Avatar" style="width:80px;height:80px;border-radius:50%">
        <h3>${currentUser.displayName}</h3>
        <p>${currentUser.email}</p>
      </div>
    `;
    modal.style.display = "block";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Current user loaded:", user);
    currentUser = user;
    loginBtn.textContent = "Logout";
    userInfoDiv.innerHTML = "";

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL
    });

    const userStatusRef = ref(rtdb, `/status/${user.uid}`);
    const isOffline = { state: "offline", last_changed: rtdbTimestamp() };
    const isOnline = { state: "online", last_changed: rtdbTimestamp() };
    const connectedRef = ref(rtdb, ".info/connected");
    onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;
      onDisconnect(userStatusRef).set(isOffline).then(() => set(userStatusRef, isOnline));
    });

    if (Notification.permission !== "granted") Notification.requestPermission();

    loadUsers();
    loadRooms();
  } else {
    currentUser = null;
    loginBtn.textContent = "Sign in with Google";
    userInfoDiv.innerHTML = "";
    userList.innerHTML = "";
    document.getElementById("room-list").innerHTML = "";
    document.getElementById("messages").innerHTML = "<p>Please sign in to view messages.</p>";
  }
});

function getConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function loadUsers() {
  console.log("Loading users...");
  getDocs(collection(db, "users")).then((snapshot) => {
    userList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      if (currentUser && docSnap.id !== currentUser.uid) {
        const li = document.createElement("li");
        li.id = `user-${docSnap.id}`;
        li.innerHTML = `${user.name} <span id="status-${docSnap.id}">🔴</span>`;
        li.onclick = () => {
          selectedUser = { uid: docSnap.id, ...user };
          selectedRoom = null;
          document.getElementById("chat-header").innerText = `Chat with ${user.name}`;
          loadPrivateMessages();
        };
        userList.appendChild(li);

        const statusRef = ref(rtdb, `/status/${docSnap.id}`);
        onValue(statusRef, (snap) => {
          const state = snap.val()?.state || "offline";
          document.getElementById(`status-${docSnap.id}`).textContent =
            state === "online" ? "🟢" : "🔴";
        });
      }
    });
  });
}

function loadRooms() {
  console.log("Loading rooms...");
  const rooms = ["General", "Advertising", "Entertainment"];
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = "";
  rooms.forEach((roomId) => {
    const li = document.createElement("li");
    li.textContent = roomId;
    li.onclick = () => {
      selectedUser = null;
      selectedRoom = roomId;
      document.getElementById("chat-header").innerText = `Room: ${roomId}`;
      loadRoomMessages(roomId);
    };
    roomList.appendChild(li);
  });
}

function showNotification(sender, text, iconUrl) {
  if (document.hidden && Notification.permission === "granted") {
    new Notification(sender, {
      body: text,
      icon: iconUrl || undefined
    });
  }
}

input.addEventListener("input", () => {
  let path;
  if (selectedUser) {
    const convId = getConversationId(currentUser.uid, selectedUser.uid);
    path = `/typing/${convId}/${currentUser.uid}`;
  } else if (selectedRoom) {
    path = `/typing_room/${selectedRoom}/${currentUser.uid}`;
  } else return;

  const typingRef = ref(rtdb, path);
  set(typingRef, true);
  clearTimeout(window.typingTimeout);
  window.typingTimeout = setTimeout(() => set(typingRef, false), 1500);
});

document.getElementById("image-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || (!selectedUser && !selectedRoom)) return;

  const storageRef = sRef(storage, `images/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  const messageData = {
    imageUrl,
    timestamp: serverTimestamp(),
    senderId: currentUser.uid,
  };

  if (selectedUser) {
    const convId = getConversationId(currentUser.uid, selectedUser.uid);
    await addDoc(collection(db, "conversations", convId, "messages"), messageData);
  }

  if (selectedRoom) {
    messageData.senderName = currentUser.displayName;
    await addDoc(collection(db, "rooms", selectedRoom, "messages"), messageData);
  }
});

document.getElementById("send-btn").addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text || (!selectedUser && !selectedRoom)) return;

  const messageData = {
    text,
    timestamp: serverTimestamp(),
    senderId: currentUser.uid,
  };

  if (selectedUser) {
    const convId = getConversationId(currentUser.uid, selectedUser.uid);
    await addDoc(collection(db, "conversations", convId, "messages"), messageData);
  }

  if (selectedRoom) {
    messageData.senderName = currentUser.displayName;
    await addDoc(collection(db, "rooms", selectedRoom, "messages"), messageData);
  }

  input.value = "";
});

function loadPrivateMessages() {
  if (!currentUser) return;
  if (unsubscribeMessages) unsubscribeMessages();

  const convId = getConversationId(currentUser.uid, selectedUser.uid);
  const q = query(collection(db, "conversations", convId, "messages"), orderBy("timestamp"));
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const sender = msg.senderId === currentUser.uid ? "You" : selectedUser.name;
      const div = document.createElement("div");
      div.className = `msg ${msg.senderId === currentUser.uid ? "msg-right" : "msg-left"}`;
      div.innerHTML = msg.imageUrl
        ? `<img src="${msg.imageUrl}" style="max-width:200px" />`
        : `${msg.text}`;

      messagesDiv.appendChild(div);

      if (msg.senderId !== currentUser.uid) {
        showNotification(selectedUser.name, msg.text, selectedUser.avatar);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  const typingIndicator = document.createElement("div");
  typingIndicator.id = "typing-indicator";
  messagesDiv.appendChild(typingIndicator);

  const typingRef = ref(rtdb, `/typing/${convId}/${selectedUser.uid}`);
  onValue(typingRef, (snap) => {
    typingIndicator.textContent = snap.val() ? `${selectedUser.name} is typing...` : "";
  });
}

function loadRoomMessages(roomId) {
  if (!currentUser) return;
  if (unsubscribeMessages) unsubscribeMessages();

  const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp"));
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.className = `msg ${msg.senderId === currentUser.uid ? "msg-right" : "msg-left"}`;
      div.innerHTML = msg.senderId === currentUser.uid
        ? (msg.imageUrl ? `<img src="${msg.imageUrl}" style="max-width:200px" />` : msg.text)
        : (msg.imageUrl
            ? `<b>${msg.senderName}:</b><br><img src="${msg.imageUrl}" style="max-width:200px" />`
            : `<b>${msg.senderName}:</b> ${msg.text}`);

      messagesDiv.appendChild(div);

      if (msg.senderId !== currentUser.uid) {
        showNotification(msg.senderName, msg.text);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  const typingIndicator = document.createElement("div");
  typingIndicator.id = "typing-indicator";
  messagesDiv.appendChild(typingIndicator);

  const typingRoomRef = ref(rtdb, `/typing_room/${roomId}`);
  onValue(typingRoomRef, (snap) => {
    const typingUsers = [];
    snap.forEach(child => {
      if (child.key !== currentUser.uid && child.val()) {
        typingUsers.push(child.key);
      }
    });
    typingIndicator.textContent = typingUsers.length
      ? `${typingUsers.length} user(s) are typing...`
      : "";
  });
}

const modal = document.getElementById("user-modal");
const modalContent = document.getElementById("modal-user-info");
const closeBtn = document.querySelector(".close-btn");

closeBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};
