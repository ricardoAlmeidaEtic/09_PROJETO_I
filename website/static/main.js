let currentPage = null;

window.onload = () => {

    document.getElementById('submitFile').onclick = async (e) => {
        e.preventDefault();
        let formData = new FormData();
        let fileInput = document.querySelector('#file_content');
        let file = fileInput.files[0];

        if (!file) {
            alert("Não tem nenhum ficheiro adicionado!");
        } else {
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('date', getFormattedDate());
            formData.append('action', 'createFile');
            formData.append('folder',currentPage)

            await post('/website/createFile/',
                formData,
                {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
        }

        window.location.reload();
    };

    document.getElementById('submitFolder').onclick = async (e) => {
        e.preventDefault();
        let folder = document.querySelector('#folder_name');

        if (!folder.value) {
            alert("Não tem nenhum nome designado para o folder!");
        } else {
            await post('/website/createFolder/',
                JSON.stringify({
                    name: folder.value,
                    parent_folder: currentPage,
                    action: 'createFolder'
                }),
                {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
        }

        window.location.reload();
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
            return data;
        } else {
            throw new Error(`Error occurred while performing the operation.`);
        }

    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

const getCookie = (name) =>{
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const getFormattedDate = () =>{
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const goToFolder = async(id) =>{
    items = await post('/website/goToFolder/',
        JSON.stringify({
            id: id,
            action: 'goToFolder'
        }),
        {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    );
    
    const pathUI = document.querySelector("path-ui")
    const driveList = document.querySelector(".drive-items")
    
    driveList.innerHTML="";

    if(id != '')
        pathUI.style.display ="block";

    items.folders.forEach((element, index) => {
        driveList.innerHTML +=`
            <new-element id="${element.id}" name="${element.name}" date="${element.date}" type="1"></new-element>
        `
    });

    items.files.forEach((element, index) => {
        driveList.innerHTML +=`
            <new-element id="${element.id}" name="${element.name}" date="${element.date}" type="0"></new-element>
        `
    });

    currentPage = id;
}


document.addEventListener("DOMContentLoaded", () =>{
    const dropArea = document.querySelector('#dropArea');
    const fileInput = document.querySelector('#file_content');
    

    dropArea.addEventListener('click', () =>{
        console.log("click")
        fileInput.click();
    });

    dropArea.addEventListener('dragover', (e) =>{
        console.log("dragover",e)
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', (e) =>{
        console.log("dragleave",e)
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (e) =>{
        e.preventDefault();
        e.stopPropagation();
        
        dropArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            addFiles(files)
            console.log("adicionou 1",files)
        }
    });

    fileInput.addEventListener('change',  () =>{
        console.log("adicionou 3",fileInput.files)
        if (fileInput.files.length > 0) {
            dropArea.querySelector('p').textContent = fileInput.files[0].name;
        } else {
            dropArea.querySelector('p').textContent = 'Drag and drop a file here or click to select a file';
        }
    });

    const addFiles = (filesContent) =>{
        console.log("adicionou 2",filesContent)
        if (filesContent.length > 0) {
            dropArea.querySelector('p').textContent = filesContent[0].name;
        } else {
            dropArea.querySelector('p').textContent = 'Drag and drop a file here or click to select a file';
        }
    };

});