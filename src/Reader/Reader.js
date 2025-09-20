import { html } from '../_lib/utils.js';
import './Reader.css';
import { Header } from './components/Header.js';
import { Menu } from './components/Menu.js';
import { List } from './components/List.js';
import { MetadataModal } from './modals/Metadata.js';
import { DataView } from './components/DataView.js';
import { renderError } from './components/Error.js';
import { SelectFolder } from './components/SelectFolder.js';
import { SelectFile } from './components/SelectFile.js';
import { RowModal } from './modals/Row.js';
import { QueryModal } from './modals/Query.js';
import { BulkUpsertModal } from './modals/BulkUpsert.js';
import { ErrorModal } from './modals/Error.js';
import { FolderService } from '../_lib/folderService.js';

export class Reader {
	constructor(controller) {
		this.controller = controller;
		this.container = document.createElement('div');
		this.container.classList.add('reader-container');
		document.body.appendChild(this.container);
		this.currentState = null;
		this.currentSchema = null;

		this.header = new Header(this);
		this.menu = new Menu(this);
		this.list = new List(this);
		this.metadataModal = new MetadataModal(this);
		this.dataView = new DataView(this);
		this.selectFolder = new SelectFolder();
		this.selectFile = new SelectFile();
		this.rowModal = new RowModal(this);
		this.queryModal = new QueryModal(this);
		this.bulkUpsertModal = new BulkUpsertModal(this);
		this.errorModal = new ErrorModal(this);
		this.folderService = new FolderService();

		this.render();
	}

	render() {
		this.container.innerHTML = html`
			<div class="reader-content active">
				<div class="reader-loading">
					<div class="loading-spinner"></div>
					<p>Loading...</p>
				</div>
			</div>
            ${this.menu.render()}
		`;
	}

	async showContent() {
		const currentFileName = window.appController?.currentFileName || '';
		try {
			const filesResult = await this.folderService.getFiles();
			const folderName = await this.folderService.getFolderName();
			const files = filesResult.files || [];
			this.showSelectFile(files, folderName || '', currentFileName);
		} catch (error) {
			this.showSelectFile([], '', currentFileName);
		}
	}

	showLoadingState(message = 'Loading...') {
		const content = this.container.querySelector('.reader-content');
		if (content && message && message.trim() !== '') {
			content.innerHTML = html`
				<div class="loading-state">
					<div class="loading-spinner"></div>
					<p>${message}</p>
				</div>
			`;
		}
	}

	showDatabaseState({ action, state, metadata, message }) {
		this.currentState = state;
		this.currentSchema = metadata?.schema;

		if (metadata?.schema?.title) {
			this.header.updateTitle(metadata.schema.title);
		}

		if (metadata && metadata.schema) {
			this.showDynamicUI(metadata.schema, state);
			if (metadata?.schema?.title) {
				this.header.updateTitle(metadata.schema.title);
			}
			this.header.updateFilterIcons();
		}
	}

	showDynamicUI(schema, state) {
		const content = this.container.querySelector('.reader-content');

		const existingHeader = this.container.querySelector('.reader-header');
		if (!existingHeader) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = this.header.render();
			const headerElement = tempDiv.firstElementChild;
			this.container.insertBefore(headerElement, this.container.firstChild);
		}

		this.header.show();
		this.header.showActions();
		setTimeout(() => {
			this.header.showAddItemButton();
		}, 0);
		this.menu.showDatabaseActions();

		const uiContent = this.dataView.render(schema, state);
		content.innerHTML = uiContent;
	}

	setFilter(fieldName, value) {
		localStorage.setItem(`filter_${fieldName}`, value);
		this.controller.deselectRow();

		if (this.currentSchema && this.currentState) {
			this.showDynamicUI(this.currentSchema, this.currentState);
			this.header.updateFilterIcons();
			if (this.currentSchema.title) {
				this.header.updateTitle(this.currentSchema.title);
			}
		}
	}

	showSelectedEditModal(itemId = null) {
		this.rowModal.show(itemId);
	}

	hideSelectedEditModal() {
		this.rowModal.hide();
	}

	showQueryModal() {
		this.queryModal.show();
	}

	hideQueryModal() {
		this.queryModal.hide();
	}

	handleSelectedEditFormSubmit(form) {
		const formData = new FormData(form);
		const data = {};

		for (const [key, value] of formData.entries()) {
			data[key] = value;
		}

		const itemId = data.id;

		if (itemId) {
			delete data.id;
			this.controller.dispatchUpdateData(data, itemId);
		} else {
			this.controller.dispatchInsertData(data);
		}

		this.hideSelectedEditModal();
		this.controller.selectedRowId = null;
		this.header.hideSelectedEditButton();
	}

	showBulkUpsertModal() {
		this.bulkUpsertModal.show();
	}

	hideBulkUpsertModal() {
		this.bulkUpsertModal.hide();
	}

	handleBulkUpsertSubmit() {
		const textarea = document.querySelector('#bulk-upsert-data');
		const data = textarea.value.trim();

		if (!data) {
			alert('Please enter some data to process.');
			return;
		}

		const items = data
			.split('\n')
			.filter((line) => line.trim())
			.map((line) => {
				const match = line.match(/^(\d+)\s*-\s*(.+)$/);
				if (match) {
					const [, id, name] = match;
					return {
						id: parseInt(id),
						text: name.trim(),
						status: 'Todo',
					};
				}
				return null;
			})
			.filter((item) => item !== null);

		if (items.length === 0) {
			alert('No valid data found. Please use the format: id - name');
			return;
		}

		this.controller.dispatchBulkUpsert(items);
		this.hideBulkUpsertModal();
	}

	selectRow(rowId) {
		this.dataView.selectRow(rowId);
		this.header.showSelectedEditButton();
	}

	clearRowSelection() {
		this.dataView.clearRowSelection();
		this.header.hideSelectedEditButton();
	}

	showAddForm() {
		this.showSelectedEditModal(null);
	}

	showEditForm(itemId) {
		this.showSelectedEditModal(itemId);
	}

	handleDeleteClick(itemId) {
		if (confirm('Are you sure you want to delete this item?')) {
			this.controller.dispatchDeleteData(itemId);
		}
	}

	showDatabaseError(error) {
		this.errorModal.showDatabaseError(error);
	}

	hideError() {
		this.errorModal.hide();
	}

	showSelectFolder() {
		const existingHeader = this.container.querySelector('.reader-header');
		if (existingHeader) {
			existingHeader.remove();
		}

		this.menu.hideDatabaseActions();

		const content = this.container.querySelector('.reader-content');
		if (content) {
			content.innerHTML = this.selectFolder.render();
		}
	}

	showSelectFile(files = [], folderName = '', currentFileName = '') {
		const safeFiles = Array.isArray(files) ? files : [];

		const existingHeader = this.container.querySelector('.reader-header');
		if (existingHeader) {
			existingHeader.remove();
		}

		this.menu.hideDatabaseActions();

		const content = this.container.querySelector('.reader-content');
		if (content) {
			content.innerHTML = this.selectFile.render(safeFiles, folderName, currentFileName);
		}
	}

	showReaderPane = () => {
		this.menu.hideHamburgerMenu();
		const readerPane = this.container.querySelector('.reader-content');
		const filesPane = this.container.querySelector('.files-content');

		if (readerPane && filesPane) {
			readerPane.classList.add('active');
			filesPane.classList.remove('active');
		}
	}

	showFilesPane = () => {
		this.menu.hideHamburgerMenu();
		const readerPane = this.container.querySelector('.reader-content');
		const filesPane = this.container.querySelector('.files-content');

		if (readerPane && filesPane) {
			readerPane.classList.remove('active');
			filesPane.classList.add('active');
		}
	}

}
