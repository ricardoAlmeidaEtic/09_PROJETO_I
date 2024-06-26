const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
<style>
    .drive-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #ddd;
        padding: 10px;
        cursor: pointer;
        flex-wrap: wrap;
    }

    .drive-item a {
        display: flex;
        align-items: center;
        text-decoration: none; 
        color: black;
        flex: 1;
    }

    .drive-item:hover {
        background-color: lightgray;
    }

    .drive-item-icon {
        width: 40px;
        background-color: #eee;
        margin-right: 10px;
        flex-shrink: 0;
    }

    .drive-item-icon img {
        width: 100%;
    }

    .drive-item-details {
        flex: 1;
        min-width: 0;
        overflow: overlay;
    }

    .drive-item-name {
        font-weight: bold;
        word-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .drive-item-date {
        color: #666;
        white-space: nowrap;
    }

    .drive-item-delete {
        background: red;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        flex-shrink: 0;
    }

    .drive-item-download {
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        flex-shrink: 0;
    }
</style>

<li class="drive-item">
    <a id="drive-link" style="width: 100%;">

        <div class="drive-item-icon">
            <img>
        </div>

        <div class="drive-item-details">
            <span class="drive-item-name"></span>
            <span class="drive-item-date"></span>
        </div>

        <div id="move">
            <div class="drive-item-icon drive-item-download">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-move-183-439500.png">
            </div>
        </div>

        <div id="download">
            <div class="drive-item-icon drive-item-download">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-download-1767976-1502312.png">
            </div>
        </div>

        <div id="delete">
            <div class="drive-item-icon drive-item-delete">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-trash-1767922-1502175.png">
            </div>
        </div>

    </a>
</li>

`;

class Item extends HTMLElement {

    static observedAttributes = ['id','name','type','date','parentfolder'];
    shadowRoot;
    folder;
    #id = null;
    #name  = null;
    #type  = null;
    #date  = null;
    #parentfolder = null;

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.appendChild(itemTemplate.content.cloneNode(true));
        this.folder = this.shadowRoot.querySelector("#drive-item");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'id':
                this.#id = newVal
                break
            case 'name':
                this.#name = newVal
                break
            case 'parentfolder':
                this.#parentfolder = newVal
                break
            case 'date':
                this.#date = newVal
                break
            case 'type':
                this.#type = newVal
                break
        }

        this.render()
    }

    render(){
        const driveLink = this.shadowRoot.querySelector("#drive-link");
        const driveItemIcon = this.shadowRoot.querySelector(".drive-item-icon");
        const driveItemDetails = this.shadowRoot.querySelector(".drive-item-details");
        const driveItemDelete = this.shadowRoot.querySelector("#delete");
        const driveItemDownload = this.shadowRoot.querySelector("#download");
        const driveItemMove = this.shadowRoot.querySelector("#move");

        if(this.#type == 1) {
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-folder-1166-470303.png"
            driveItemDownload.innerHTML = ""
        } else {
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-vlc-media-player-3-735027.png"
            driveItemDownload.onclick = (e) => this.download(e,this);
        }

        driveItemDelete.onclick = (e) => this.delete(e,this);
        driveItemMove.onclick = (e) => this.move(e,this);

        driveLink.onclick = (e) =>{
            if(this.#type == 1){
                this.dispatchEvent(new CustomEvent('pathEvent', {
                    detail: { item:this }, 
                    bubbles: true, 
                    composed: true 
                }));

                goToFolder(this.#id);
            }
        }

        driveItemDetails.children[0].innerText = this.#name
        driveItemDetails.children[1].innerText = this.#date
    }

    async delete(event,element) {
        event.stopPropagation();
        event.preventDefault();
        let typeText = parseInt(element.#type) === 1 ? "Folder" : "File";
        
        if (confirm(`Are you sure you want to delete this ${typeText}?`)) {
            const id = element.#id;
            const parentFolder = element.#parentfolder;
            
            await post(`/website/delete${typeText}/`,
                JSON.stringify({
                    id: id,
                    action: `delete${typeText}`
                }),
                {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
            element.remove();
            
            if(parentFolder !== 'null')
                goToFolder(parentFolder)
        }
    }

    async download(event,element) {
        event.stopPropagation();
        event.preventDefault();
        let typeText = parseInt(element.#type) === 1 ? "Folder" : "File";
        const id = element.#id;
    
        try {
            const response = await fetch(`/website/download${typeText}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    id: id,
                    action: `download${typeText}`
                })
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    async move(event,element) {
        event.stopPropagation();
        event.preventDefault();
        var modal = document.querySelector("#ModalMove");
        setPreviousElement(element)
        goToFolderSelect(null,element.id)
        modal.style.display = "block";
    }
}
customElements.define("new-element", Item);

const pathTemplate = document.createElement("template");
pathTemplate.innerHTML = `
<style>
    #pathId{
        overflow: auto;
        width: 100%;
        margin: auto;
    }

    #pathContent{
        display:flex;
        justify-content: flex-end;
        margin-right: 15px;
    }

    #pathContent img{
        width: 50px;
    }

</style>

<div id="pathContent">
    <div id="pathId"></div>
    <a><img src="https://cdn.iconscout.com/icon/free/png-256/free-back-arrow-1767531-1502435.png"></a>
</div>

`;

class Path extends HTMLElement {

    shadowRoot;
    #pathItem = null
    #redirectItem = null
    #path = [];
    #direction = [];

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.appendChild(pathTemplate.content.cloneNode(true));
        this.#pathItem = this.shadowRoot.querySelector("#pathId");
        this.#redirectItem = this.shadowRoot.querySelector("a");
    }

    add(path, direction){
        this.#path.push(path);
        this.#direction.push(direction);
        this.render();
    }

    clear(){
        this.#path = [];
        this.#direction = [];
        this.render();
    }

    render() {
        this.#pathItem.innerHTML = "";
        this.#path.forEach((element, index) => {
            let a = document.createElement("a");
            let span = document.createElement("span");

            span.innerText = "/";
            a.innerText = element;
            a.href = "#";
            a.onclick = (event) => {
                event.preventDefault();
                this.handlePathClick(index);
            };

            this.#pathItem.appendChild(span);
            this.#pathItem.appendChild(a);
        });

        this.#redirectItem.onclick = () =>{
            
            if(this.#direction[this.#direction.length - 2] !== undefined)
                goToFolder(this.#direction[this.#direction.length - 2])
            else
                goToFolder(null)

            this.#path.splice(this.#path.length -1, 1);
            this.#direction.splice(this.#direction.length -1, 1);
            
            if(this.#path.length === 0 && this.#direction.length === 0) {
                const pathUI = document.querySelector("path-ui")
                pathUI.style.display = "none";
            } else {
                this.render();
            }
        }
    }

    handlePathClick(index) {
        goToFolder(this.#direction[index]);
        if (!this.#direction.includes(this.#direction[index])) {
            this.add(this.#path[index], this.#direction[index]);
        } else {
            for (let pos = this.#path.length - 1; pos > index; pos--) {
                this.#path.splice(pos, 1);
                this.#direction.splice(pos, 1);
            }
        }
        this.render();
    }

    connectedCallback() {
        document.addEventListener('pathEvent', this.handlePathEvent.bind(this));
    }

    handlePathEvent(event) {
        this.add(event.detail.item.getAttribute("name"),event.detail.item.getAttribute("id"))
    }

}
customElements.define("path-ui", Path);

const itemSelectTemplate = document.createElement("template");
itemSelectTemplate.innerHTML = `
<style>
    .drive-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #ddd;
        padding: 10px;
        cursor: pointer;
        flex-wrap: wrap;
    }

    .drive-item a {
        display: flex;
        align-items: center;
        text-decoration: none; 
        color: black;
        flex: 1;
    }

    .drive-item:hover {
        background-color: lightgray;
    }

    .drive-item-icon {
        width: 40px;
        background-color: #eee;
        margin-right: 10px;
        flex-shrink: 0;
    }

    .drive-item-icon img {
        width: 100%;
    }

    .drive-item-details {
        flex: 1;
        min-width: 0;
        overflow: overlay;
    }

    .drive-item-name {
        font-weight: bold;
        word-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .drive-item-date {
        color: #666;
        white-space: nowrap;
    }

    .drive-item-delete {
        background: red;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        flex-shrink: 0;
    }

    .drive-item-download {
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        flex-shrink: 0;
    }
</style>

<li class="drive-item">
    <a id="drive-link" style="width: 100%;">

        <div class="drive-item-icon">
            <img>
        </div>

        <div class="drive-item-details">
            <span class="drive-item-name"></span>
            <span class="drive-item-date"></span>
        </div>

        <div id="select">
            <input type="checkbox" id="selectItem"/>
        </div>

    </a>
</li>

`;

class ItemSelect extends HTMLElement {

    static observedAttributes = ['id','name','type','date','parentfolder'];
    shadowRoot;
    folder;
    #id = null;
    #name  = null;
    #type  = null;
    #date  = null;
    #parentfolder = null;
    #previousId = null;

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.appendChild(itemSelectTemplate.content.cloneNode(true));
        this.folder = this.shadowRoot.querySelector("#drive-item");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'id':
                this.#id = newVal
                break
            case 'name':
                this.#name = newVal
                break
            case 'parentfolder':
                this.#parentfolder = newVal
                break
            case 'date':
                this.#date = newVal
                break
            case 'type':
                this.#type = newVal
                break
        }

        this.render()
    }

    render(){
        if(this.#parentfolder !== this.#id){
            const driveLink = this.shadowRoot.querySelector("#drive-link");
            const driveItemIcon = this.shadowRoot.querySelector(".drive-item-icon");
            const driveItemDetails = this.shadowRoot.querySelector(".drive-item-details");
            const driveItemSelectInput = this.shadowRoot.querySelector("#selectItem");
            
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-folder-1166-470303.png"
            driveItemSelectInput.onclick = (e) => this.select(e,this.shadowRoot);
            
            
            driveLink.onclick = (e) =>{
                this.dispatchEvent(new CustomEvent('selectPathEvent', {
                    detail: { item:this }, 
                    bubbles: true, 
                    composed: true 
                }));

                goToFolderSelect(this.#id)
            }
            
            driveItemDetails.children[0].innerText = this.#name
            driveItemDetails.children[1].innerText = this.#date
        }
    }
        
    select(event,element) {
        event.stopPropagation();
        const list = document.querySelector('.drive-items-select')
        const driveItemSelectInput = element.querySelector("#selectItem")

        if(driveItemSelectInput.checked){
            console.log(list)
            list.querySelectorAll('select-element').forEach((node) => {
                let checkbox = node.shadowRoot.querySelector('#selectItem') //removed all checked boxes other than the one thats clicked.
                if(checkbox !== driveItemSelectInput){
                    checkbox.checked = false 
                }
            });
        }
    }

    getType(){
        return this.#type
    }
}
customElements.define("select-element", ItemSelect);

const selectPathTemplate = document.createElement("template");
selectPathTemplate.innerHTML = `
<style>
    #pathId{
        overflow: auto;
        width: 100%;
        margin: auto;
    }

    #pathContent{
        display:none;
        justify-content: flex-end;
        margin-right: 15px;
    }

    #pathContent img{
        width: 50px;
    }

</style>

<div id="pathContent">
    <div id="pathId"></div>
    <a><img src="https://cdn.iconscout.com/icon/free/png-256/free-back-arrow-1767531-1502435.png"></a>
</div>

`;

class SelectPath extends HTMLElement {

    shadowRoot;
    #pathItem = null
    #redirectItem = null
    #path = []; //nameoflink
    #direction = []; //link

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.appendChild(selectPathTemplate.content.cloneNode(true));
        this.#pathItem = this.shadowRoot.querySelector("#pathId");
        this.#redirectItem = this.shadowRoot.querySelector("a");
    }

    add(path, direction){
        this.#path.push(path);
        this.#direction.push(direction);
        this.render();
    }

    clear(){
        this.#path = [];
        this.#direction = [];
        this.render();
    }

    render() {
        this.#pathItem.innerHTML = "";
        this.#path.forEach((element, index) => {
            this.shadowRoot.querySelector("#pathContent").style.display="flex"
            let a = document.createElement("a");
            let span = document.createElement("span");

            span.innerText = "/";
            a.innerText = element;
            a.href = "#";
            a.onclick = (event) => {
                event.preventDefault();
                this.handlePathClick(index);
            };

            this.#pathItem.appendChild(span);
            this.#pathItem.appendChild(a);
        });

        this.#redirectItem.onclick = () =>{
            console.log(this.#direction[this.#direction - 2])
            if(this.#direction[this.#direction.length - 2] !== undefined) //go to root folder after clicking back icon
                goToFolderSelect(this.#direction[this.#direction.length - 2])
            else
                goToFolderSelect(null)

            this.#path.splice(this.#path.length -1, 1);
            this.#direction.splice(this.#direction.length -1, 1);

            if(this.#path.length === 0 && this.#direction.length === 0) {
                const pathUI = document.querySelector("select-path-ui")
                pathUI.style.display = "none";
            } else {
                this.render();
            }

        }

    }

    handlePathClick(index) {
        goToFolderSelect(this.#direction[index]);
        if (!this.#direction.includes(this.#direction[index])) {
            this.add(this.#path[index], this.#direction[index]);
        } else {
            for (let pos = this.#path.length - 1; pos > index; pos--) {
                this.#path.splice(pos, 1);
                this.#direction.splice(pos, 1);
            }
        }
        this.render();
    }

    connectedCallback() {
        document.addEventListener('selectPathEvent', this.handlePathEvent.bind(this));
    }

    handlePathEvent(event) {
        this.add(event.detail.item.getAttribute("name"),event.detail.item.getAttribute("id"))
    }

}
customElements.define("select-path-ui", SelectPath);