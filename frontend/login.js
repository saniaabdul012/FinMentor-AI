import { login } from "../Backend/auth.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const user = await login(email, password);

    if(user){
        window.location.href = "dashboard.html";
    }

});