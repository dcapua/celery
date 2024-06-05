# celery weather app
## Tech Stack and Learnings

Site: https://celeryweather.netlify.app/

Frontend: Vanilla JS, Bootstrap, HTML/CSS\
Backend: Node, Firebase, Axios\
DevOps: Vite, Netlify

*Sigh*... Yes, another weather app for retrieving current weather conditions. However, there is also a "memories" feature which allows the user to save the current location/conditions and a note to their own personal database. 

My primary motivation for this project was to get more familiar with vanilla JS, Firebase/Firestore, and Bootstrap. I learned a ton, including: 

* **Vanilla JS** - The imperative nature of vanilla Javascript is clunky. Maybe there is a REACTive framework to help with that?
* **Bootstrap** - I didn't want to spend a ton of time on styling for this project and Bootstrap came in handy, especially the grid system and breakpoints for a responsive layout.
* **API calls** - HTTP requests, async/await and try/catch, OpenWeatherMap API, Postman
* **Firebase** - Firestore noSQL database, user authentification (using GoogleAuthProvider), queries
* **Environment variables** - Sensitive items like the OpenWeatherMap API key need to be stored in a .env file and configured in Netlify for the production build to work properly.
* **UI** - Don't show elements that don't need to be shown!
* **Git branches** - The true utility of git branches. When you have something that works, don't mess it up, start a branch!
