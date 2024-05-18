import './assets/style.scss';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let positions = [];
for (let x = 8; x <= 88; x += 8) {
    for (let y = 4; y <= 96; y += 4) {
        positions.push({ x, y });
    }
}

positions = shuffleArray(positions);

let currentPositionIndex = 0;

function getNextPosition() {
    const position = positions[currentPositionIndex];
    currentPositionIndex = (currentPositionIndex + 1) % positions.length;
    return position;
}

const app = document.querySelector('#app');
const urlParams = new URLSearchParams(window.location.search);

document.querySelector('#stream').value = localStorage.getItem("stream");
if (urlParams.get("stream") != null) localStorage.setItem('stream', urlParams.get("stream"));

document.querySelector('#maxmessages').value = localStorage.getItem("maxmessages");
if (urlParams.get("maxmessages") != null) localStorage.setItem('maxmessages', urlParams.get("maxmessages"));

if (urlParams.get("stream") != null && urlParams.get("stream") != "" && urlParams.get("maxmessages") != null) {
    document.querySelector('#prompt').remove();
}

const client = new tmi.Client({
    connection: {
        secure: true,
        reconnect: true
    },
    channels: [urlParams.get('stream')],
});

client.connect();

let gz = 0;

client.on("clearchat", () => {
    app.innerHTML = "";
});

client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
    const messageElement = document.getElementById(`message=${userstate['target-msg-id']}`);
    if (messageElement) {
        messageElement.remove();
    }
});

function getMessageHTML(message, { emotes }) {
    if (!emotes) return message;

    const stringReplacements = [];

    Object.entries(emotes).forEach(([id, positions]) => {
        const position = positions[0];
        const [start, end] = position.split("-");
        const stringToReplace = message.substring(parseInt(start, 10), parseInt(end, 10) + 1);

        stringReplacements.push({
            stringToReplace: stringToReplace,
            replacement: `<img src='https://static-cdn.jtvnw.net/emoticons/v2/${id}/animated/dark/1.0' onerror="this.src='https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0'" loading="lazy">`,
        });
    });

    return stringReplacements.reduce((acc, { stringToReplace, replacement }) => {
        return acc.split(stringToReplace).join(replacement);
    }, message);
}

client.on('message', (channel, tags, message, self) => {
    createMessageWindow(tags, message);
});

function createMessageWindow(tags, message) {
    const fragment = document.createDocumentFragment();
    const messageWindow = document.createElement('div');
    messageWindow.classList.add("window");
    messageWindow.id = `message=${tags['id']}`;

    const html = `
        <div class="title-bar">
            <div class="title-bar-text">${tags['display-name']}</div>
            <div class="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
            </div>
        </div>
        <div class="window-body">
            <p>${getMessageHTML(message, tags)}</p>
        </div>
    `;

    messageWindow.innerHTML = html;

    const closeButton = messageWindow.querySelector('.title-bar-controls button[aria-label="Close"]');
    closeButton.onclick = function() {
        messageWindow.remove();
    };

    const titleBar = messageWindow.querySelector('.title-bar');
    let isDragging = false;
    let initialX;
    let initialY;

    titleBar.addEventListener('mousedown', (event) => {
        isDragging = true;
        initialX = event.clientX - messageWindow.getBoundingClientRect().left;
        initialY = event.clientY - messageWindow.getBoundingClientRect().top;
        messageWindow.style.zIndex = gz++;
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            requestAnimationFrame(() => {
                const newX = event.clientX - initialX;
                const newY = event.clientY - initialY;
                messageWindow.style.left = `${newX}px`;
                messageWindow.style.top = `${newY}px`;
            });
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    const { x, y } = getNextPosition();
    messageWindow.style.right = `${x}%`;
    messageWindow.style.top = `${y}%`;
    messageWindow.style.zIndex = gz;

    messageWindow.onclick = function() {
        messageWindow.style.zIndex = gz++;
    };

    fragment.appendChild(messageWindow);

    if (app.children.length > urlParams.get("maxmessages")) {
        app.children[0].remove();
    }
    app.appendChild(fragment);
    return messageWindow;
}