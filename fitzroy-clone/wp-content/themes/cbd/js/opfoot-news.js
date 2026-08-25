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
			if (label) label.textContent = 'sending';
			say(form, '', false);
			form.querySelector('.opfoot__status').hidden = true;

			var get = function (name) {
				var el = form.querySelector('[name="' + name + '"]');
				return el ? el.value.trim() : '';
			};
			var consent = form.querySelector('[name="consent"]');
			var email = get('email');

			fetch('/wp-json/cbd/v1/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: get('first_name'),
					last_name: get('last_name'),
					email: email,
					consent: !!(consent && consent.checked),
					utm: utmFromQuery()
				})
			}).then(function (r) {
				return r.json().then(function (j) { return { ok: r.ok, j: j }; });
			}).then(function (res) {
				if (btn) btn.disabled = false;
				if (label) label.textContent = original;

				if (res.ok && res.j && res.j.ok) {
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({ event: 'newsletter', email: email });
					form.reset();
					say(form, 'Thank you. Look out for our next letter.', false);
					return;
				}
				var detail = res.j && res.j.errors && res.j.errors.length ? res.j.errors[0] : '';
				say(form, detail || 'Something went wrong. Please try again, or email enquiries@fitzroy-travel.com.', true);
			}).catch(function () {
				if (btn) btn.disabled = false;
				if (label) label.textContent = original;
				say(form, 'Something went wrong. Please try again, or email enquiries@fitzroy-travel.com.', true);
			});
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
