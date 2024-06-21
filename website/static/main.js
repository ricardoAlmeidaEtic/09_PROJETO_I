let currentPage = '';

window.onload = () => {
    const dropArea = document.querySelector('#dropArea');
    const fileInput = document.querySelector('#file_content');
    const folderInput = document.querySelector('#folder_name');
    const modal = document.getElementById("myModal");
    const span = document.getElementsByClassName("close")[0];

    const addFiles = (filesContent) => {
        dropArea.querySelector('p').textContent = filesContent.length > 0 ? filesContent[0].name : 'Drag and drop a file here or click to select a file';
    };

    const handleFileSubmit = async (e) => {
        e.preventDefault();
        let file = fileInput.files[0];

        if (!file) {
            alert("Não tem nenhum ficheiro adicionado!");
            return;
        }

        let formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('date', getFormattedDate());
        formData.append('action', 'createFile');
        formData.append('folder', currentPage);

        await post('/website/createFile/', formData, { 'X-CSRFToken': getCookie('csrftoken') });

        goToFolder(currentPage);
        fileInput.value = null;
        addFiles([]);
    };

    const handleFolderSubmit = async (e) => {
        e.preventDefault();

        if (!folderInput.value) {
            alert("Não tem nenhum nome designado para o folder!");
            return;
        }

        await post('/website/createFolder/', JSON.stringify({
            name: folderInput.value,
            parent_folder: currentPage,
            action: 'createFolder'
        }), {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        });

        goToFolder(currentPage);
        folderInput.value = "";
    };

    const handleDropAreaClick = () => {
        fileInput.click();
    };

    const handleDropAreaDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    };

    const handleDropAreaDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    };

    const handleDropAreaDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            addFiles(files);
        }
    };

    const handleFileInputChange = () => {
        addFiles(fileInput.files);
    };


    span.onclick = () => {
        modal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('submitFile').onclick = handleFileSubmit;
    document.getElementById('submitFolder').onclick = handleFolderSubmit;
    dropArea.addEventListener('click', handleDropAreaClick);
    dropArea.addEventListener('dragover', handleDropAreaDragOver);
    dropArea.addEventListener('dragleave', handleDropAreaDragLeave);
    dropArea.addEventListener('drop', handleDropAreaDrop);
    fileInput.addEventListener('change', handleFileInputChange);
};

const post = async (url, body, headers = {}) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Error occurred while performing the operation.');
        }

        return await response.json();
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
};

const getCookie = (name) => {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const targetCookie = cookies.find(cookie => cookie.startsWith(`${name}=`));
    return targetCookie ? decodeURIComponent(targetCookie.split('=')[1]) : null;
};

const getFormattedDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const goToFolder = async (id) => {
    const pathUI = document.querySelector("path-ui");
    const driveList = document.querySelector(".drive-items");

    const items = await post('/website/goToFolder/', JSON.stringify({
        id: id,
        action: 'goToFolder'
    }), {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
    });


    driveList.innerHTML = "";

    if (id !== '') {
        pathUI.style.display = "block";
    }

    items.folders.forEach((element) => {
        driveList.innerHTML += `
            <new-element id="${element.id}" name="${element.name}" parentfolder="${element.parent_folder}" date="${element.date}" type="1"></new-element>
        `;
    });

    items.files.forEach((element) => {
        driveList.innerHTML += `
            <new-element id="${element.id}" name="${element.name}" parentfolder="${element.folder}" date="${element.date}" type="0"></new-element>
        `;
    });

    if(items.files.length === 0 && items.folders.length === 0){
        driveList.innerHTML+=`
            <h1 style="margin-top:100px;">Não tem nenhum ficheiro ou folder criado.</h1>
        `
    }

    currentPage = id;
};

