
const socket = io(); // Connect to the server

// Get the username from localStorage
const username = localStorage.getItem('username');

// Fetch and display all messages
async function fetchMessages() {
    try {
        const response = await fetch('/chat/messages');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const messages = await response.json();
        console.log('Fetched messages:', messages); // Debugging

        const messageList = document.getElementById('messages');
        messageList.innerHTML = ''; // Clear existing messages

        // Sort messages by createdAt
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        messages.forEach(msg => {
            appendMessage(msg.User.name, msg.message);
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Function to append a message to the chat
function appendMessage(username, message) {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = `${username}: ${message}`;
    messageList.appendChild(newMessage);
}

// Call fetchMessages when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
    socket.emit('joinChat', username); // Emit join event after fetching messages
});

// Handle receiving a new message
socket.on('newMessage', (msg) => {
    appendMessage(msg.User.name, msg.message);
});

// Handle when a user joins the chat
socket.on('userJoined', (msg) => {
    appendMessage('System', msg);
});

// Handle sending a message
document.getElementById('sendBtn').addEventListener('click', () => {
    const message = document.getElementById('chatInput').value;
    if (message.trim()) { // Check if the message is not empty
        socket.emit('chatMessage', { username, message }); // Send username with message
        document.getElementById('chatInput').value = ''; // Clear input after sending
    }
});

// Create Group Modal Logic
document.addEventListener("DOMContentLoaded", () => {
    const createGroupBtn = document.getElementById("createGroupBtn");
    const createGroupModal = document.getElementById("createGroupModal");
    const closeModal = document.querySelector(".close");

    // Show the modal when the "Create Group" button is clicked
    createGroupBtn.addEventListener("click", () => {
        createGroupModal.style.display = "block";
    });

    // Close the modal when the close button (x) is clicked
    closeModal.addEventListener("click", () => {
        createGroupModal.style.display = "none";
    });

    // Close the modal when the user clicks outside of the modal content
    window.addEventListener("click", (event) => {
        if (event.target === createGroupModal) {
            createGroupModal.style.display = "none";
        }
    });

    // Logic for adding group members
    const addMemberBtn = document.getElementById("addMemberBtn");
    const groupMemberMobile = document.getElementById("groupMemberMobile");
    const membersList = document.getElementById("membersList");

    let members = []; // Store added members

    addMemberBtn.addEventListener("click", () => {
        const mobile = groupMemberMobile.value.trim();
        if (mobile && !members.includes(mobile)) {
            members.push(mobile);

            const listItem = document.createElement("li");
            listItem.textContent = mobile;

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "X";
            removeBtn.addEventListener("click", () => {
                members = members.filter(member => member !== mobile);
                membersList.removeChild(listItem);
            });

            listItem.appendChild(removeBtn);
            membersList.appendChild(listItem);
            groupMemberMobile.value = '';
        }
    });

    // Handle form submission for creating a group
    const groupForm = document.getElementById("groupForm");

    groupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const groupName = document.getElementById("groupName").value;

        if (!groupName || members.length === 0) {
            alert('Please enter a group name and add at least one member.');
            return;
        }
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }

        const token = getCookie('token');
        const data = {
            name: groupName,
            members: members
        };
        alert(data);
        alert('Group created successfully!');
        createGroupModal.style.display = "none";
        groupForm.reset();
        members = [];
        membersList.innerHTML = '';

        // Uncomment the following code when you're ready to send data to the server
        /*
        fetch('/group/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Group created successfully!');
                    createGroupModal.style.display = "none"; // Hide modal after submission
                    groupForm.reset(); // Clear the form
                    members = []; // Clear the members array
                    membersList.innerHTML = ''; // Clear the list
                } else {
                    alert('Error creating group: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        */
    });
});
