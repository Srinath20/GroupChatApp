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
            // document.cookie = `token=${data.token}; path=/; secure; HttpOnly;`; //you can't see cookies with HttpOnly in the browser console.
            document.cookie = `token=${data.token}; path=/; SameSite=Strict`;
            console.log('Login successful and token stored in cookie');
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});
