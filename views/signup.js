document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const BASE_URL = '<%= process.env.BASE_URL %>';
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from submitting the traditional way
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const formData = {
            name,
            email,
            phone,
            password
        };

        try {
            const response = await fetch(`${BASE_URL}/user/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                const data = await response.json();
                alert('User created successfully!');
                window.location.href = './login.html';
            } else {
                const errorData = await response.json();
                alert(errorData.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong! Please try again later.');
        }
    });
});
