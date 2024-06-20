const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
<style>
    .drive-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #ddd;
        padding: 10px;
        cursor: pointer;
    }

    .drive-item a{
        display: flex;
        align-items: center;
        text-decoration: none; 
        color:black;
    }

    .drive-item:hover{
        background-color: lightgray;
    }

    .drive-item-icon {
        width: 40px;
        height: 40px;
        background-color: #eee;
        margin-right: 10px;
    }

    .drive-item-icon img{
        width: 100%;
    }

    .drive-item-details {
        flex: 1;
    }

    .drive-item-name {
        font-weight: bold;
    }

    .drive-item-date {
        color: #666;
    }

    .drive-item-delete{
        background: red;
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
        <a id="download">
            <div class="drive-item-icon drive-item-download">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-download-1767976-1502312.png">
            </div>
        </a>
        <a id="delete">
            <div class="drive-item-icon drive-item-delete">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-trash-1767922-1502175.png">
            </div>
        </a>
    </a>
</li>

`;

class Item extends HTMLElement {

    static observedAttributes = ['id','name','type','date'];
    shadowRoot;
    folder;
    #id = null;
    #name  = null;
    #type  = null;
    #date  = null;
    #parentFolder = null;

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
            case 'parentFolder':
                this.#parentFolder = newVal
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

        driveLink.onclick = () =>{
            this.dispatchEvent(new CustomEvent('pathEvent', {
                detail: { item:this }, 
                bubbles: true, 
                composed: true 
            }));

            goToFolder(this.#id);
        }

        if(this.#type == 1)
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-folder-1166-470303.png"
        else
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-vlc-media-player-3-735027.png"

        driveItemDetails.children[0].innerText = this.#name
        driveItemDetails.children[1].innerText = this.#date

        driveItemDelete.onclick = () => this.delete(this);
        driveItemDownload.onclick = () => this.download(this);
    }

    async delete(element) {
        let typeText = parseInt(element.#type) === 1 ? "Folder" : "File";
        
        if (confirm(`Are you sure you want to delete this ${typeText}?`)) {
            element.remove();
            
            const id = element.#id;
    
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
        }
    }

    async download(element){
        /*let typeText = parseInt(element.#type) === 1 ? "Folder" : "File";

        if (confirm(`Are you sure you want to delete this ${typeText}?`)) {
            element.innerHTML=""
            
            await post(`/website/delete${typeText}/`,
                JSON.stringify({
                    id: element.#id,
                    action: `delete${typeText}`
                }),
                {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            );
        }*/
       console.log("downloaded", element)
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
                goToFolder('')

            this.#path.splice(this.#path.length -1, 1);
            this.#direction.splice(this.#direction.length -1, 1);
            
            if(this.#path.length === 0 && this.#direction.length === 0) {
                const pathUI = document.querySelector("path-ui")
                pathUI.style.display = "none";
                console.log("apagou!",pathUI)
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
                console.log("===========================================");
                console.log("removed [", pos, "]");
                console.log("===========================================");
                console.log("this.#direction[pos]", this.#direction[pos]);
                console.log("direction", this.#direction[index]);
                console.log("removed - pos", pos);
                console.log("array path: ", this.#path);
                console.log("array direction: ", this.#direction);

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