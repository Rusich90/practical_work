document.getElementById('search').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword').value;
    const response = await fetch(`http://localhost:3000/keywords/${keyword}`);
    
    if (response.ok) {
        const urls = await response.json();
        const urlList = document.getElementById('urlList');
        urlList.innerHTML = '';
        urls.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.classList.add('link');
            li.addEventListener('click', () => downloadFile(url, keyword));
            urlList.appendChild(li);
        });
    } else {
        alert('Keyword not found');
    }
});

async function downloadFile(url, keyword) {
    const ws = new WebSocket('ws://localhost:3000');
    ws.onopen = () => {
        ws.send(JSON.stringify({ url, keyword }));
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const downloadStatus = document.getElementById('downloadStatus');

        if (data.status === 'downloading') {
            downloadStatus.textContent = `Downloading... ${data.downloaded} bytes downloaded`;
        } else if (data.status === 'complete') {
            const response = await fetch(data.file_path);
            const blob = await response.blob();
            await localforage.setItem(data.file_path, blob);
            downloadStatus.textContent = 'Download complete';

            const downloadedList = document.getElementById('downloadedList');
            const li = document.createElement('li');
            li.textContent = data.file_path;
            li.classList.add('link');
            li.addEventListener('click', () => displayFile(data.file_path));
            downloadedList.appendChild(li);
        } else if (data.status === 'error') {
            downloadStatus.textContent = `Error: ${data.error}`;
        }
    };
}

async function displayFile(filePath) {
    const blob = await localforage.getItem(filePath);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
