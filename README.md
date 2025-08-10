Step - 1. Open your project folder in VS Code
Make sure you're inside the root folder of your React project. This folder should contain a package.json file.

Step - 2. Open the terminal in VS Code
Use the shortcut:
Windows/Linux: Ctrl + ~
Mac: Cmd + ~
Or go to View > Terminal

Step - 3. Install dependencies using npm 
If you're using npm, run:

npm install

This will read the package.json file and install all the dependencies listed under dependencies and devDependencies into the node_modules folder.

Step - 4. Wait for installation to complete
You’ll see a node_modules folder and a package-lock.json (if using npm) appear in your project folder once it's done.

Step - 5. Run your React project (optional check)
To make sure everything installed correctly, run the app:

npm start

This will start the React development server (usually on http://localhost:3000).

If you don't have a package.json file:
You're probably not in the right folder or haven't initialized a project yet. In that case, you can start a new React project with:

npx create-react-app my-app
cd my-app
code .

Then follow the steps above.
