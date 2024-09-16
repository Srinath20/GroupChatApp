document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user name in localStorage
            document.cookie = `token=${data.token}; path=/; SameSite=Strict`;
            localStorage.setItem('username', data.username); // Store username in localStorage
            window.location.href = '/chat.html'; // Redirect to chat window
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});
