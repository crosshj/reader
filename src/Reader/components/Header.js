import { html } from '../../_lib/utils.js';

export class Header {
	constructor(reader) {
		this.reader = reader;
	}

	render() {
		return html`
			<header class="reader-header">
				<div class="header-left">
					<button
						id="hamburger-menu"
						class="hamburger-btn"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line
								x1="3"
								y1="6"
								x2="21"
								y2="6"
							></line>
							<line
								x1="3"
								y1="12"
								x2="21"
								y2="12"
							></line>
							<line
								x1="3"
								y1="18"
								x2="21"
								y2="18"
							></line>
						</svg>
					</button>
					<h1 id="app-title">Reader</h1>
				</div>
			</header>
		`;
	}

	updateTitle(title) {
		// Ensure reader and container exist
		if (!this.reader?.container) {
			console.warn('Header.updateTitle called before Reader is fully initialized');
			return;
		}
		
		const titleElement = this.reader.container.querySelector('#app-title');
		if (titleElement) {
			const activeFilter = this.getActiveFilterDisplay();
			const displayTitle = activeFilter
				? `${title} | ${activeFilter}`
				: title;
			titleElement.textContent = displayTitle;
		}
	}

	showActions() {
		const header = this.reader.container.querySelector('.reader-header');
		if (!header || header.querySelector('.header-right')) return;

		// Add the right side actions
		const rightSide = document.createElement('div');
		rightSide.className = 'header-right';
		rightSide.innerHTML = html`
			<button
				id="selected-edit-btn"
				class="selected-edit-btn"
				style="display: none;"
				title="Edit Selected Item"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
					></path>
					<path
						d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
					></path>
				</svg>
			</button>
			<div
				id="filter-icons-container"
				class="filter-icons-container"
			>
				<!-- Filter icons will be dynamically added here -->
			</div>
		`;
		header.appendChild(rightSide);
	}

	hideActions() {
		const rightSide = this.reader.container.querySelector('.header-right');
		if (rightSide) {
			rightSide.remove();
		}
	}

	updateFilterIcons() {
		const filterContainer = this.reader.container.querySelector(
			'#filter-icons-container'
		);
		if (!filterContainer || !this.reader.currentSchema) return;

		// Get filterable enum fields
		const filterableFields =
			this.reader.currentSchema.fields?.filter(
				(field) => field.type === 'enum' && field.filterable
			) || [];

		if (filterableFields.length === 0) {
			filterContainer.innerHTML = '';
			return;
		}

		// Generate filter icons
		filterContainer.innerHTML = filterableFields
			.map((field) => {
				const currentFilter = this.getCurrentFilter(field.name);
				const isFiltered = currentFilter && currentFilter !== 'all';

				return html`
					<button
						class="filter-icon-btn ${isFiltered ? 'active' : ''}"
						data-field="${field.name}"
						title="Filter by ${field.displayName} (${currentFilter ||
						field.options[0]})"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							stroke="none"
						>
							<path
								d="M23,2v0.5l-8,10v8l-5,2v-10l-8-10V2H23z"
							></path>
							${isFiltered
								? html`<circle
										cx="20"
										cy="20"
										r="3"
										fill="white"
								  ></circle>`
								: ''}
						</svg>
					</button>
				`;
			})
			.join('');
	}

	showSelectedEditButton() {
		const editBtn = this.reader.container.querySelector('#selected-edit-btn');
		if (
			editBtn &&
			this.reader.currentSchema?.controls?.includes('selected-edit')
		) {
			editBtn.style.display = 'flex';
		}
	}

	hideSelectedEditButton() {
		const editBtn = this.reader.container.querySelector('#selected-edit-btn');
		if (editBtn) {
			editBtn.style.display = 'none';
		}
	}

	getActiveFilterDisplay() {
		if (!this.reader.currentSchema?.fields) return null;

		const filterableFields = this.reader.currentSchema.fields.filter(
			(field) => field.type === 'enum' && field.filterable
		);

		const activeFilters = [];
		filterableFields.forEach((field) => {
			const currentFilter = this.getCurrentFilter(field.name);
			if (currentFilter && currentFilter !== 'all') {
				activeFilters.push(currentFilter);
			}
		});

		return activeFilters.length > 0 ? activeFilters.join(', ') : null;
	}

	getCurrentFilter(fieldName) {
		// Get from localStorage or return default (first option)
		const stored = localStorage.getItem(`filter_${fieldName}`);
		if (stored) {
			// Validate that the stored value is still valid
			const field = this.reader.currentSchema?.fields?.find(
				(f) => f.name === fieldName
			);
			if (
				field &&
				(stored === 'all' || field.options?.includes(stored))
			) {
				return stored;
			}
		}

		// Return default (first option)
		const field = this.reader.currentSchema?.fields?.find(
			(f) => f.name === fieldName
		);
		return field?.options?.[0] || 'all';
	}


	toggleFilterDropdown(fieldName) {
		// Close any existing dropdowns
		this.hideAllFilterDropdowns();

		// Show the dropdown for this field
		this.showFilterDropdown(fieldName);
	}

	showFilterDropdown(fieldName) {
		const field = this.reader.currentSchema.fields?.find(
			(f) => f.name === fieldName
		);
		if (!field || field.type !== 'enum' || !field.filterable) return;

		const currentFilter = this.getCurrentFilter(fieldName);

		// Create backdrop overlay
		const backdrop = document.createElement('div');
		backdrop.className = 'filter-dropdown-backdrop';

		// Create dropdown
		const dropdown = document.createElement('div');
		dropdown.className = 'filter-dropdown';

		// Add "All" option
		const allOption = document.createElement('div');
		allOption.className = `filter-option ${currentFilter === 'all'
			? 'selected'
			: ''}`;
		allOption.textContent = 'All';
		allOption.dataset.value = 'all';
		dropdown.appendChild(allOption);

		// Add field options
		field.options.forEach((option) => {
			const optionElement = document.createElement('div');
			optionElement.className = `filter-option ${currentFilter === option
				? 'selected'
				: ''}`;
			optionElement.textContent = option;
			optionElement.dataset.value = option;
			dropdown.appendChild(optionElement);
		});

		// Add event listeners
		dropdown.addEventListener('click', (e) => {
			const option = e.target.closest('.filter-option');
			if (option) {
				const value = option.dataset.value;
                this.updateFilterIcons();
				this.reader.setFilter(fieldName, value);
				this.hideAllFilterDropdowns();
			}
		});

		// Add backdrop click handler
		backdrop.addEventListener('click', () => {
			this.hideAllFilterDropdowns();
		});

		// Add document click handler to close dropdown
		document.addEventListener('click', (e) => {
			if (
				!e.target.closest('.filter-dropdown') &&
				!e.target.closest('.filter-icon-btn')
			) {
				this.hideAllFilterDropdowns();
			}
		});

		// Append dropdown to backdrop (so it gets centered)
		backdrop.appendChild(dropdown);
		
		// Append backdrop to container
		this.reader.container.appendChild(backdrop);

		// Show the dropdown with animation
		requestAnimationFrame(() => {
			backdrop.classList.add('show');
		});
	}

	hideAllFilterDropdowns() {
		const backdrops = this.reader.container.querySelectorAll(
			'.filter-dropdown-backdrop'
		);
		backdrops.forEach((backdrop) => {
			backdrop.classList.remove('show');
			setTimeout(() => backdrop.remove(), 150);
		});

		const dropdowns = this.reader.container.querySelectorAll(
			'.filter-dropdown'
		);
		dropdowns.forEach((dropdown) => {
			dropdown.classList.remove('show');
			setTimeout(() => dropdown.remove(), 150);
		});
	}

	calculateFilterCounts(fieldName, items) {
		const field = this.reader.currentSchema.fields?.find(
			(f) => f.name === fieldName
		);
		if (!field || field.type !== 'enum' || !field.filterable) return {};

		const counts = { all: items.length };
		field.options.forEach((option) => {
			counts[option] = items.filter(
				(item) => item[fieldName] === option
			).length;
		});

		return counts;
	}
}