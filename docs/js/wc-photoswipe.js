// import PhotoSwipeLightbox from './js/photoswipe-lightbox.esm.min.js';
// import PhotoSwipe from './js/photoswipe.esm.min.js';

customElements.define('photo-swipe', class extends HTMLElement {

	/**
	 * Instantiate the Web Component
	 */
	constructor () {

		// Get parent class properties
		super();

		// Initialize the script
		this.init();

	}

	/**
	 * Initialize Photoswipe
	 */
	async init () {

		// Get the images
		let imgs = this.querySelectorAll('a img');

		// Wait for all images to load
		let loaded = await Promise.all([...imgs].filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })));

		// Set height and width
		for (let img of imgs) {
			let link = img.closest('a');
			link.setAttribute('data-pswp-height', img.naturalHeight);
			link.setAttribute('data-pswp-width', img.naturalWidth);
		}

		// Initialize Photoswipe
		this.lightbox = new PhotoSwipeLightbox({
			gallery: this,
			children: 'a',
			pswpModule: PhotoSwipe
		});
		this.lightbox.init();

	}

});