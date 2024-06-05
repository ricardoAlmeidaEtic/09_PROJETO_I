/**TODO HEADER */
const headerTemplate = document.createElement("template");
headerTemplate.innerHTML = `
<li class="drive-item">
    <a href="/website/{{folder.id}}" style="width: 95%;">
        <div class="drive-item-icon">
            <img src="https://cdn.iconscout.com/icon/free/png-256/free-folder-1166-470303.png">
        </div>
        <div class="drive-item-details">
            <span class="drive-item-name">{{ folder.name }}</span>
            <span class="drive-item-date">{{ folder.date }}</span>
        </div>
        <a onclick="delete(' {{folder.id}} ')" style="width: 5%;">
            <div class="drive-item-icon dive-item-delete">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-trash-1767922-1502175.png">
            </div>
        </a>
    </a>
</li>

`;
class Folder extends HTMLElement {

    static observedAttributes = ['folder'];
    shadowRoot;
    #folder;
    #folderVal;
    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.append(headerTemplate.content.cloneNode(true));
        this.#folder = this.shadowRoot.querySelector("#drive-item");
        this.#folder.onclick = () => this.dispatchEvent(new CustomEvent("clicked"));
    }

    attributeChangedCallback(attrName, oldVal, newVal) {

        switch (attrName) {
            case 'folder':
                this.#folder = newVal
        }
    }

    get folder() {
        return this.#folderVal;
    }
    set folder(val) {
        this.#folderVal = val;
    }
}
customElements.define("folder-element", Folder);