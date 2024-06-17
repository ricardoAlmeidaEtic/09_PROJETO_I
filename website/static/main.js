window.onload = () => {
    document.getElementById('submitFile').onclick = async (e) => {
        e.preventDefault();
        var formData = new FormData();
        var fileInput = document.querySelector('#file_content');
        var file = fileInput.files[0];
        var folder_id = document.querySelector('#folder_id');

        if (!file) {
            alert("Não tem nenhum ficheiro adicionado!");
        } else {
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('date', getFormattedDate());
            formData.append('action', 'createFile');
            formData.append('folder',folder_id.value)

            await post('/website/createFile/',
                formData,
                {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
        }
    };

    document.getElementById('submitFolder').onclick = async (e) => {
        e.preventDefault();
        var folder = document.querySelector('#folder_name');
        var folder_id = document.querySelector('#folder_id');

        if (!folder.value) {
            alert("Não tem nenhum nome designado para o folder!");
        } else {
            await post('/website/createFolder/',
                JSON.stringify({
                    name: folder.value,
                    parent_folder: parseInt(folder_id.value),
                    action: 'createFolder'
                }),
                {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
        }
    };
}

const post = async (url, body, headers = {}) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            window.location.reload();
            console.log(data)
        } else {
            throw new Error(`Error occurred while performing the operation.`);
        }
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getFormattedDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", () =>{
    var dropArea = document.querySelector('#dropArea');
    var fileInput = document.querySelector('#file_content');
    var folder_id = document.querySelector('#folder_id');
    const path_ui = document.querySelector('path-ui');

    dropArea.addEventListener('click', function() {
        fileInput.click();
    });

    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();

        dropArea.classList.remove('dragover');
        var files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
        }
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            dropArea.querySelector('p').textContent = fileInput.files[0].name;
        } else {
            dropArea.querySelector('p').textContent = 'Drag and drop a file here or click to select a file';
        }
    });

    if(folder_id.value)
        console.log(folder_id)
        path_ui.add(folder_id.name,folder_id.value)
});