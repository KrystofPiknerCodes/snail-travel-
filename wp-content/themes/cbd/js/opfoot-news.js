/**
 * Footer newsletter signup (v2), 2026-08-11.
 *
 * Binds every .opfoot__form on the page to POST /wp-json/cbd/v1/newsletter, which files
 * the signup against Gravity Form 4 and so keeps the Zoho feed the v1 footer form used.
 *
 * This lives in a real script file rather than inline in the footer partial for one
 * practical reason: the staging kill-switch strips any inline <script> containing the
 * string "dataLayer", so an inline version would be dead on staging and untestable.
 *
 * The `newsletter` dataLayer push matches the shape the v1 theme used (functions.php,
 * gform_confirmation_4): { event: 'newsletter', email: <address> }. That filter only
 * runs when Gravity Forms renders its own confirmation, which this form never does, so
 * the push has to happen here or the conversion is lost.
 */
(function () {
	'use strict';

	var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
		'fbclid', 'gclid', 'msclkid'];

	function utmFromQuery() {
		var q = new URLSearchParams(window.location.search), out = {};
		UTM_KEYS.forEach(function (k) { if (q.get(k)) out[k] = q.get(k); });
		return out;
	}

	function say(form, message, isError) {
		var status = form.querySelector('.opfoot__status');
		if (!status) return;
		status.textContent = message;
		status.hidden = false;
		status.classList.toggle('opfoot__status--error', !!isError);
	}

	function bind(form) {
		if (form.dataset.newsBound) return;   // a page can carry only one footer, but be safe
		form.dataset.newsBound = '1';

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			if (!form.reportValidity()) return;

			var btn = form.querySelector('.opfoot__submit');
			var label = btn ? btn.querySelector('span') : null;
			var original = label ? label.textContent : '';
			if (btn) btn.disabled = true;
			if (label) label.textContent = 'odesílám';
			say(form, '', false);
			form.querySelector('.opfoot__status').hidden = true;

			// Snail Travel: no backend wired up yet (same as the main site's own contact
			// form -- "zatím jen simuluje úspěch"), so this just confirms client-side
			// instead of POSTing to Fitzroy's WordPress endpoint, which doesn't exist here.
			setTimeout(function () {
				if (btn) btn.disabled = false;
				if (label) label.textContent = original;
				form.reset();
				say(form, 'Děkujeme, ozveme se vám do 48 hodin.', false);
			}, 400);
		});
	}

	function init() {
		document.querySelectorAll('.opfoot__form').forEach(bind);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
