let currentPage = '';
let currentPageSelect = '';
let previousElement = null;

window.onload = () => {
    const dropArea = document.querySelector('#dropArea');
    const fileInput = document.querySelector('#file_content');
    const folderInput = document.querySelector('#folder_name');
    const modal = document.getElementById("ModalMove");
    const span = document.getElementsByClassName("close")[0];
    const closeModal = document.querySelector("#closeModal");
    const confirmModal = document.querySelector("#confirmModal");

    const addFiles = (filesContent) => {
        dropArea.querySelector('p').textContent = filesContent.length > 0 ? filesContent[0].name : 'Drag and drop a file here or click to select a file';
        fileInput.files[0] = filesContent[0];
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
            fileInput.files = files;
            addFiles(files);
        }
    };

    const handleFileInputChange = () => {
        addFiles(fileInput.files);
    };

    
    span.onclick = () => {
        modal.style.display = "none";
    }
    
    closeModal.addEventListener("click", () =>{
        modal.style.display = "none";
    });
    
    confirmModal.addEventListener("click",(e) =>{
        const list = document.querySelector('.drive-items-select')
        list.querySelectorAll('select-element').forEach(async (node) => {
            let checkbox = node.shadowRoot.querySelector('#selectItem');
            let id = null;
            console.log("currentPage",currentPage)
            console.log("checkbox.checked",checkbox.checked)
            if(checkbox.checked){
                id = node.id

                await post('/website/changeLocation/', JSON.stringify({
                    id: previousElement.id,
                    action: 'changeLocation',
                    parentId : id,
                    typeFile : previousElement.getAttribute("type"),
                }), {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                });
            }

            setTimeout(()=> {
                location.reload();
             }
             ,500);
        });
        
        modal.style.display = "none";
        
        list.querySelectorAll('select-element').forEach((node) => {
            let checkbox = node.shadowRoot.querySelector('#selectItem');
            checkbox.checked = false
        });
        
        this.dispatchEvent(new CustomEvent('pathClearEvent', {
            detail: { item:this }, 
            bubbles: true, 
            composed: true 
        }));
        
        goToFolder(null);
        
    });
    
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
    
    if (id !== null) {
        pathUI.style.display = "block";
    }else{
        pathUI.style.display = "none";
        pathUI.clear()
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

const goToFolderSelect = async (id, clicked = null) => {
    const pathUI = document.querySelector("select-path-ui");
    const driveList = document.querySelector(".drive-items-select");
    
    if(clicked !== null)
        currentPageSelect = clicked;
    
    const items = await post('/website/goToFolder/', JSON.stringify({
        id: id,
        action: 'goToFolder'
    }), {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
    });
    
    driveList.innerHTML = "";
    
    if (id !== null) {
        pathUI.style.display = "block";
    }else{
        pathUI.style.display = "none";
        pathUI.clear()
    }
    
    items.folders.forEach((element) => {
        if(parseInt(element.id) !== parseInt(currentPageSelect)){
            driveList.innerHTML += `
            <select-element id="${element.id}" name="${element.name}" parentfolder="${element.parent_folder}" date="${element.date}" type="1"></select-element>
            `;
        }
    });
    
    if(items.files.length === 0 && items.folders.length === 0){
        driveList.innerHTML+=`
        <h1 style="margin-top:100px;">Não tem nenhum ficheiro ou folder criado.</h1>
        `
    }
    currentPage = id;
};

const setPreviousElement = (element) =>{
    previousElement = element;
};
