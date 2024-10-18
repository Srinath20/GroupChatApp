const socket = io();
const username = localStorage.getItem('username');
const groupList = document.getElementById('groupList');
let currentGroupId = null;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function fetchUserGroups() {
    const token = getCookie('token');
    fetch('/group/user-groups', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayGroups(data.groups);
            } else {
                console.error('Error fetching groups:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayGroups(groups) {
    groupList.innerHTML = '';
    groups.forEach(group => {
        const button = document.createElement('button');
        button.textContent = group.name;
        button.classList.add('group-button');
        button.addEventListener('click', () => selectGroup(group.id));
        groupList.appendChild(button);
    });
}

function selectGroup(groupId) {
    currentGroupId = groupId;
    socket.emit('joinGroup', groupId);
    fetchGroupMessages(groupId);
    document.getElementById('groupManagement').style.display = 'block';
}

async function fetchGroupMessages(groupId) {
    try {
        const token = getCookie('token');
        const response = await fetch(`/group/${groupId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.messages)) {
            displayMessages(data.messages);
        } else {
            console.error('Unexpected response structure:', data);
            throw new Error('Unexpected response structure');
        }
    } catch (error) {
        console.error('Error fetching group messages:', error);
        displayErrorMessage('Failed to load group messages. Please try again.');
    }
}

function displayMessages(messages) {
    const messageList = document.getElementById('messages');
    messageList.innerHTML = ''; // Clear existing messages

    if (messages.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'No messages in this group yet.';
        messageList.appendChild(emptyMessage);
    } else {
        messages.forEach(msg => {
            appendMessage(msg.User.name, msg.message);
        });
    }
}

function appendMessage(username, message, isSystemMessage = false) {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = isSystemMessage ? message : `${username}: ${message}`;
    if (isSystemMessage) {
        newMessage.classList.add('system-message');
    }
    messageList.appendChild(newMessage);
    messageList.scrollTop = messageList.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('chatInput');
    const message = messageInput.value.trim();
    if (message && currentGroupId) {
        socket.emit('groupMessage', { username, message, groupId: currentGroupId });
        appendMessage(username, message); // Immediately append the user's own message
        messageInput.value = '';
    }
}

function addUserToGroup() {
    const addUserInput = document.getElementById('addUserPhone');
    const userPhone = addUserInput.value.trim();
    if (!userPhone) {
        alert('Please enter a valid phone number.');
        return;
    }
    const token = getCookie('token');
    fetch(`/group/${currentGroupId}/add-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userPhone })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('User added to the group successfully.');
                addUserInput.value = ''; // Clear the input field
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding the user to the group.');
        });
}

function makeUserAdmin() {
    const makeAdminInput = document.getElementById('makeAdminUser');
    if (!makeAdminInput) {
        console.error('makeAdminUser input not found');
        alert('An error occurred. Please try again later.');
        return;
    }

    const userPhone = makeAdminInput.value.trim();
    if (!userPhone) {
        alert('Please enter a valid phone number.');
        return;
    }

    const token = getCookie('token');
    fetch(`/group/${currentGroupId}/make-admin`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userPhone })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Server error');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('User is now an admin of the group.');
                console.log(data.message);
                makeAdminInput.value = ''; // Clear the input field
            } else {
                alert(data.message || 'Failed to make user an admin.');
                console.log(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}`);
        });
}

function removeUserFromGroup() {
    const removeUserInput = document.getElementById('removeUserId');
    const userPhone = removeUserInput.value.trim();
    if (!userPhone) {
        alert('Please enter a valid phone number.');
        return;
    }
    const token = getCookie('token');
    fetch(`/group/${currentGroupId}/remove-user`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userPhone })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('User removed from the group successfully.');
                removeUserInput.value = ''; // Clear the input field
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while removing the user from the group.');
        });
}

function displayErrorMessage(message) {
    const messageList = document.getElementById('messages');
    messageList.innerHTML = ''; // Clear existing messages
    const errorMessage = document.createElement('li');
    errorMessage.textContent = message;
    errorMessage.style.color = 'red';
    messageList.appendChild(errorMessage);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUserGroups();
    socket.emit('joinChat', username);
});

socket.on('newMessage', (msg) => {
    if (msg.groupId === currentGroupId) {
        appendMessage(msg.User.name, msg.message);
    }
});

socket.on('userJoined', (msg) => {
    appendMessage('System', msg, true);
});

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Create Group Modal Logic
document.addEventListener("DOMContentLoaded", () => {
    const createGroupBtn = document.getElementById("createGroupBtn");
    const createGroupModal = document.getElementById("createGroupModal");
    const closeModal = document.querySelector(".close");

    createGroupBtn.addEventListener("click", () => {
        createGroupModal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
        createGroupModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === createGroupModal) {
            createGroupModal.style.display = "none";
        }
    });

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

    const groupForm = document.getElementById("groupForm");

    groupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const groupName = document.getElementById("groupName").value;

        if (!groupName || members.length === 0) {
            alert('Please enter a group name and add at least one member.');
            return;
        }

        const token = getCookie('token');
        const data = {
            name: groupName,
            members: members
        };

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
                    alert(`Group "${data.group.name}" created successfully!`);
                    createGroupModal.style.display = "none";
                    groupForm.reset();
                    members = [];
                    membersList.innerHTML = '';
                    fetchUserGroups(); // Refresh the group list
                } else {
                    alert('Error creating group: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while creating the group.');
            });
    });
});