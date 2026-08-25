/**
 * Enquiry form (.btform__form) — the campfire "Plan your perfect <country> safari" banner
 * on best-time, article and landing pages. Wired 2026-08-14.
 *
 * Until now every copy of this form was decorative markup: it could not be typed into and
 * the button did nothing, on all 66 live best-time pages. It now posts to
 * /wp-json/cbd/v1/contact — the same endpoint and the same Gravity Form (1) that the
 * /contact-us/ page uses — so an enquiry from here reaches enquiries@fitzroy-travel.com and
 * shows up in Gravity Forms alongside every other enquiry.
 *
 * On success we go to /contact-confirmation/?sid={entry_id}. The sid mirrors the Gravity
 * Forms confirmation queryString; inc/tracking-v2.php reads it there to push the
 * enquiry_form conversion, so this route keeps the conversion tracking the contact page has.
 *
 * Required fields: the form carries `novalidate` so the browser does not block on its own,
 * then the submit handler calls reportValidity() (which focuses and explains the first
 * problem) AND marks EVERY invalid field with .btform__field--invalid, so all of the missing
 * ones are visible at once rather than one at a time. That was Paul's actual complaint:
 * "submit button doesnt identify required fields".
 *
 * Loaded on every v2 template alongside js/opfoot-news.js; it no-ops when the page has no
 * .btform__form.
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
		var status = form.querySelector('.btform__status');
		if (!status) return;
		status.textContent = message;
		status.hidden = !message;
		status.classList.toggle('btform__status--error', !!isError);
	}

	function controls(form) {
		return Array.prototype.slice.call(form.querySelectorAll('.btform__input'));
	}

	/** Flag every field that fails validation, clear the ones that pass. Returns true if all pass. */
	function markInvalid(form) {
		var allOk = true;
		controls(form).forEach(function (el) {
			var field = el.closest('.btform__field');
			var ok = el.checkValidity();
			if (!ok) allOk = false;
			if (field) field.classList.toggle('btform__field--invalid', !ok);
		});
		return allOk;
	}

	function bind(form) {
		if (form.dataset.enquiryBound) return;
		form.dataset.enquiryBound = '1';

		// Clear a field's error mark as soon as the person fixes it.
		controls(form).forEach(function (el) {
			el.addEventListener('input', function () {
				var field = el.closest('.btform__field');
				if (field && field.classList.contains('btform__field--invalid') && el.checkValidity()) {
					field.classList.remove('btform__field--invalid');
				}
			});
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();

			var allOk = markInvalid(form);
			if (!allOk) {
				say(form, 'Please fill in the highlighted fields.', true);
				form.reportValidity();
				return;
			}
			say(form, '', false);

			var btn = form.querySelector('.btform__btn');
			var label = btn ? btn.querySelector('.btform__btntxt') : null;
			var original = label ? label.textContent : '';
			if (btn) btn.disabled = true;
			if (label) label.textContent = 'sending';

			var get = function (name) {
				var el = form.querySelector('[name="' + name + '"]');
				return el ? el.value.trim() : '';
			};

			fetch('/wp-json/cbd/v1/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: get('first_name'),
					last_name: get('last_name'),
					email: get('email'),
					phone: get('phone'),
					location: get('location'),
					message: get('message'),
					page_title: document.title,
					utm: utmFromQuery()
				})
			}).then(function (r) {
				return r.json().then(function (j) { return { ok: r.ok, j: j }; });
			}).then(function (res) {
				if (res.ok && res.j && res.j.ok) {
					window.location.href = '/contact-confirmation/' + (res.j.entry_id ? '?sid=' + res.j.entry_id : '');
					return;
				}
				if (btn) btn.disabled = false;
				if (label) label.textContent = original;
				var detail = res.j && res.j.errors && res.j.errors.length ? res.j.errors[0] : '';
				say(form, detail || 'Something went wrong sending your enquiry. Please email enquiries@fitzroy-travel.com or call +1 585 505 6307.', true);
			}).catch(function () {
				if (btn) btn.disabled = false;
				if (label) label.textContent = original;
				say(form, 'Something went wrong sending your enquiry. Please email enquiries@fitzroy-travel.com or call +1 585 505 6307.', true);
			});
		});
	}

	function init() {
		document.querySelectorAll('.btform__form').forEach(bind);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
