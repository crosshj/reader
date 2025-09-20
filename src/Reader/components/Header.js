import { html, smartDebounce } from '../../_lib/utils.js';

export class Header {
	constructor(reader) {
		this.reader = reader;
		this.searchQuery = '';
		
		// Create debounced search handler - best of all worlds
		this.debouncedSearch = smartDebounce(
			(query) => this.performSearch(query),
			150, // 150ms delay
			{
				leading: false,    // Don't execute immediately
				trailing: true,    // Execute after delay
				maxWait: 1000      // Force execution after 1 second max
			}
		);
	}

	render() {
		return html`
			<header class="reader-header">
				<!-- Mobile view: Gmail-style search input -->
				<div class="header-mobile">
					<div class="mobile-search">
						<div class="search-input-container">
						<button
							id="hamburger-menu"
							class="hamburger-btn search-hamburger"
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
						<input
							type="text"
							id="search-input"
							class="search-input"
							placeholder="Search Reader"
							autocomplete="off"
							spellcheck="false"
						/>
						<button
							id="clear-search"
							class="clear-search-btn"
							style="display: none;"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="15" y1="9" x2="9" y2="15"></line>
								<line x1="9" y1="9" x2="15" y2="15"></line>
							</svg>
						</button>
						</div>
					</div>
				</div>

				<!-- Desktop view: Original layout with search -->
				<div class="header-desktop">
					<div class="header-left">
						<button
							id="hamburger-menu-desktop"
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
					<div class="header-center">
						<div class="desktop-search">
							<div class="search-input-container">
							<input
								type="text"
								id="search-input-desktop"
								class="search-input"
								autocomplete="off"
								spellcheck="false"
							/>
							<button
								id="clear-search-desktop"
								class="clear-search-btn"
								style="display: none;"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="15" y1="9" x2="9" y2="15"></line>
									<line x1="9" y1="9" x2="15" y2="15"></line>
								</svg>
							</button>
							</div>
						</div>
					</div>
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
		
		// Update desktop title
		const titleElement = this.reader.container.querySelector('#app-title');
		if (titleElement) {
			const activeFilter = this.getActiveFilterDisplay();
			const displayTitle = activeFilter
				? `${title} | ${activeFilter}`
				: title;
			titleElement.textContent = displayTitle;
		}

		// Update sidebar header title
		const sidebarTitle = this.reader.container.querySelector('.sidebar-header h3');
		if (sidebarTitle) {
			sidebarTitle.textContent = title;
		}

		// Update mobile search placeholder
		const searchInput = this.reader.container.querySelector('#search-input');
		if (searchInput) {
			const activeFilter = this.getActiveFilterDisplay();
			const searchPlaceholder = activeFilter
				? `Search in ${title} | ${activeFilter}`
				: `Search in ${title} All`;
			searchInput.placeholder = searchPlaceholder;
		}

		// Update desktop search placeholder
		const desktopSearchInput = this.reader.container.querySelector('#search-input-desktop');
		if (desktopSearchInput) {
			const activeFilter = this.getActiveFilterDisplay();
			const searchPlaceholder = activeFilter
				? `Search in ${activeFilter}`
				: `Search in All`;
			desktopSearchInput.placeholder = searchPlaceholder;
		}
	}

	showActions() {
		const header = this.reader.container.querySelector('.reader-header');
		if (!header) return;

		// Add the right side actions to desktop header
		const desktopHeader = header.querySelector('.header-desktop');
		if (desktopHeader) {
			// Remove existing header-right if it exists to ensure fresh creation
			const existingRightSide = desktopHeader.querySelector('.header-right');
			if (existingRightSide) {
				existingRightSide.remove();
			}
			const rightSide = document.createElement('div');
			rightSide.className = 'header-right';
			rightSide.innerHTML = html`
				<button
					id="add-item-btn"
					class="add-item-btn"
					style="display: none;"
					title="Add New Item"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</button>
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
						</path>
					</svg>
				</button>
				<div
					id="filter-icons-container"
					class="filter-icons-container"
				>
					<!-- Filter icons will be dynamically added here -->
				</div>
			`;
			desktopHeader.appendChild(rightSide);
		}

		// Add the right side actions to mobile header
		const mobileHeader = header.querySelector('.header-mobile');
		if (mobileHeader) {
			// Remove existing header-right if it exists to ensure fresh creation
			const existingRightSide = mobileHeader.querySelector('.header-right');
			if (existingRightSide) {
				existingRightSide.remove();
			}
			const rightSide = document.createElement('div');
			rightSide.className = 'header-right';
			rightSide.innerHTML = html`
				<button
					id="add-item-btn-mobile"
					class="add-item-btn"
					style="display: none;"
					title="Add New Item"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</button>
				<button
					id="selected-edit-btn-mobile"
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
					id="filter-icons-container-mobile"
					class="filter-icons-container"
				>
					<!-- Filter icons will be dynamically added here -->
				</div>
			`;
			mobileHeader.appendChild(rightSide);
		}

		// Setup search listeners
		this.setupSearchListeners();
	}

	hideActions() {
		const desktopRightSide = this.reader.container.querySelector('.header-desktop .header-right');
		if (desktopRightSide) {
			desktopRightSide.remove();
		}
		const mobileRightSide = this.reader.container.querySelector('.header-mobile .header-right');
		if (mobileRightSide) {
			mobileRightSide.remove();
		}
	}

	updateFilterIcons() {
		const desktopFilterContainer = this.reader.container.querySelector(
			'#filter-icons-container'
		);
		const mobileFilterContainer = this.reader.container.querySelector(
			'#filter-icons-container-mobile'
		);
		
		if ((!desktopFilterContainer && !mobileFilterContainer) || !this.reader.currentSchema) return;

		// Update mobile search placeholder with current filter info
		const searchInput = this.reader.container.querySelector('#search-input');
		if (searchInput) {
			const activeFilter = this.getActiveFilterDisplay();
			const searchPlaceholder = activeFilter
				? `Search in ${this.reader.currentSchema?.title || 'Reader'} | ${activeFilter}`
				: `Search in ${this.reader.currentSchema?.title || 'Reader'} All`;
			searchInput.placeholder = searchPlaceholder;
		}

		// Update desktop search placeholder
		const desktopSearchInput = this.reader.container.querySelector('#search-input-desktop');
		if (desktopSearchInput) {
			const activeFilter = this.getActiveFilterDisplay();
			const searchPlaceholder = activeFilter
				? `Search in ${activeFilter}`
				: `Search in All`;
			desktopSearchInput.placeholder = searchPlaceholder;
		}

		// Get filterable enum fields
		const filterableFields =
			this.reader.currentSchema.fields?.filter(
				(field) => field.type === 'enum' && field.filterable
			) || [];

		if (filterableFields.length === 0) {
			if (desktopFilterContainer) desktopFilterContainer.innerHTML = '';
			if (mobileFilterContainer) mobileFilterContainer.innerHTML = '';
			return;
		}

		// Generate filter icons
		const filterIconsHTML = filterableFields
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

		// Update both containers
		if (desktopFilterContainer) {
			desktopFilterContainer.innerHTML = filterIconsHTML;
		}
		if (mobileFilterContainer) {
			mobileFilterContainer.innerHTML = filterIconsHTML;
		}
	}

	showAddItemButton() {
		const desktopAddBtn = this.reader.container.querySelector('#add-item-btn');
		const mobileAddBtn = this.reader.container.querySelector('#add-item-btn-mobile');
		
		if (this.reader.currentSchema?.controls?.includes('add')) {
			if (desktopAddBtn) {
				desktopAddBtn.style.display = 'flex';
			}
			if (mobileAddBtn) {
				mobileAddBtn.style.display = 'flex';
			}
		}
	}

	hideAddItemButton() {
		const desktopAddBtn = this.reader.container.querySelector('#add-item-btn');
		const mobileAddBtn = this.reader.container.querySelector('#add-item-btn-mobile');
		
		if (desktopAddBtn) {
			desktopAddBtn.style.display = 'none';
		}
		if (mobileAddBtn) {
			mobileAddBtn.style.display = 'none';
		}
	}

	showSelectedEditButton() {
		const desktopEditBtn = this.reader.container.querySelector('#selected-edit-btn');
		const mobileEditBtn = this.reader.container.querySelector('#selected-edit-btn-mobile');
		
		if (this.reader.currentSchema?.controls?.includes('selected-edit')) {
			if (desktopEditBtn) {
				desktopEditBtn.style.display = 'flex';
				// Move to first position
				const desktopHeaderRight = this.reader.container.querySelector('.header-desktop .header-right');
				if (desktopHeaderRight) {
					desktopHeaderRight.insertBefore(desktopEditBtn, desktopHeaderRight.firstChild);
				}
			}
			if (mobileEditBtn) {
				mobileEditBtn.style.display = 'flex';
				// Move to first position
				const mobileHeaderRight = this.reader.container.querySelector('.header-mobile .header-right');
				if (mobileHeaderRight) {
					mobileHeaderRight.insertBefore(mobileEditBtn, mobileHeaderRight.firstChild);
				}
			}
		}
	}

	hideSelectedEditButton() {
		const desktopEditBtn = this.reader.container.querySelector('#selected-edit-btn');
		const mobileEditBtn = this.reader.container.querySelector('#selected-edit-btn-mobile');
		
		if (desktopEditBtn) {
			desktopEditBtn.style.display = 'none';
		}
		if (mobileEditBtn) {
			mobileEditBtn.style.display = 'none';
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
		// Get from localStorage or return default ('all' means no filter)
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

		// Return 'all' as default (no filter applied)
		return 'all';
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
				// Hide edit button immediately when filter changes
				this.hideSelectedEditButton();
				this.reader.setFilter(fieldName, value);
				this.updateFilterIcons();
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

	// Search functionality
	setSearchQuery(query) {
		// Update search query immediately for visual feedback
		this.searchQuery = query;
		// Trigger debounced search operation
		this.debouncedSearch(query);
	}

	performSearch(query) {
		// Fast filtering by toggling CSS visibility instead of DOM recreation
		if (this.reader.list && this.reader.list.updateSearchFilter) {
			this.reader.list.updateSearchFilter();
		}
	}

	getSearchQuery() {
		return this.searchQuery || '';
	}

	clearSearch() {
		// Cancel any pending debounced search operations
		this.debouncedSearch.cancel();
		
		this.searchQuery = '';
		const searchInput = this.reader.container.querySelector('#search-input');
		const desktopSearchInput = this.reader.container.querySelector('#search-input-desktop');
		
		if (searchInput) {
			searchInput.value = '';
		}
		if (desktopSearchInput) {
			desktopSearchInput.value = '';
		}
		
		// Restore placeholders when clearing
		const activeFilter = this.getActiveFilterDisplay();
		const mobileSearchPlaceholder = activeFilter
			? `Search in ${this.reader.currentSchema?.title || 'Reader'} | ${activeFilter}`
			: `Search in ${this.reader.currentSchema?.title || 'Reader'} All`;
		const desktopSearchPlaceholder = activeFilter
			? `Search in ${activeFilter}`
			: `Search in All`;
		
		if (searchInput) {
			searchInput.placeholder = mobileSearchPlaceholder;
		}
		if (desktopSearchInput) {
			desktopSearchInput.placeholder = desktopSearchPlaceholder;
		}
		
		this.updateClearButtonVisibility();
		// Trigger list refresh without search filter
		if (this.reader.currentSchema && this.reader.currentState) {
			// Just refresh the data view, don't recreate the entire UI
			const uiContent = this.reader.dataView.render(this.reader.currentSchema, this.reader.currentState);
			const content = this.reader.container.querySelector('.reader-content');
			if (content) {
				content.innerHTML = uiContent;
			}
		}
	}

	show() {
		const header = this.reader.container.querySelector('.reader-header');
		if (header) {
			header.style.display = 'block';
		}
	}

	hide() {
		const header = this.reader.container.querySelector('.reader-header');
		if (header) {
			header.style.display = 'none';
		}
	}

	updateClearButtonVisibility() {
		const searchInput = this.reader.container.querySelector('#search-input');
		const clearBtn = this.reader.container.querySelector('#clear-search');
		const desktopSearchInput = this.reader.container.querySelector('#search-input-desktop');
		const desktopClearBtn = this.reader.container.querySelector('#clear-search-desktop');
		
		if (searchInput && clearBtn) {
			clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
		}
		if (desktopSearchInput && desktopClearBtn) {
			desktopClearBtn.style.display = desktopSearchInput.value.trim() ? 'flex' : 'none';
		}
	}

	setupSearchListeners() {
		const searchInput = this.reader.container.querySelector('#search-input');
		const clearBtn = this.reader.container.querySelector('#clear-search');
		const desktopSearchInput = this.reader.container.querySelector('#search-input-desktop');
		const desktopClearBtn = this.reader.container.querySelector('#clear-search-desktop');
		
		// Helper function to sync search values between mobile and desktop
		const syncSearchValues = (sourceInput, targetInput) => {
			if (sourceInput && targetInput) {
				targetInput.value = sourceInput.value;
			}
		};

		// Mobile search input listeners
		if (searchInput) {
			searchInput.addEventListener('input', (e) => {
				this.setSearchQuery(e.target.value);
				syncSearchValues(searchInput, desktopSearchInput);
				this.updateClearButtonVisibility();
			});

			searchInput.addEventListener('focus', () => {
				searchInput.placeholder = '';
			});

			searchInput.addEventListener('blur', () => {
				if (!searchInput.value.trim()) {
					const activeFilter = this.getActiveFilterDisplay();
					const searchPlaceholder = activeFilter
						? `Search in ${this.reader.currentSchema?.title || 'Reader'} | ${activeFilter}`
						: `Search in ${this.reader.currentSchema?.title || 'Reader'} All`;
					searchInput.placeholder = searchPlaceholder;
				}
			});
		}

		// Desktop search input listeners
		if (desktopSearchInput) {
			desktopSearchInput.addEventListener('input', (e) => {
				this.setSearchQuery(e.target.value);
				syncSearchValues(desktopSearchInput, searchInput);
				this.updateClearButtonVisibility();
			});

			desktopSearchInput.addEventListener('focus', () => {
				desktopSearchInput.placeholder = '';
			});

			desktopSearchInput.addEventListener('blur', () => {
				if (!desktopSearchInput.value.trim()) {
					const activeFilter = this.getActiveFilterDisplay();
					const searchPlaceholder = activeFilter
						? `Search in ${activeFilter}`
						: `Search in All`;
					desktopSearchInput.placeholder = searchPlaceholder;
				}
			});
		}

		// Clear button listeners
		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				this.clearSearch();
			});
		}
		if (desktopClearBtn) {
			desktopClearBtn.addEventListener('click', () => {
				this.clearSearch();
			});
		}
	}
}