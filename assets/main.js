// Main

const $variants = document.querySelector('.variants');
const $variantsList = $variants.querySelector('.variants__list');

const $reading = document.querySelector('.reading');
const $readingText = $reading.querySelector('.reading__text');
const $readingCheck = $reading.querySelector('.reading__check');

const $questions = document.querySelector('.questions');
const $questionsForm = $questions.querySelector('.questions__form');
const $questionsList = $questions.querySelector('.questions__list');
const $questionsCheck = $questions.querySelector('.questions__check');
const $questionsBack = $questions.querySelector('.questions__back');

const templateVariant = document.querySelector('#template-variant').content;
const templateText = document.querySelector('#template-text').content;
const templateChecks = document.querySelector('#template-checks').content;
const templateCheck = document.querySelector('#template-check').content;

// режим — 1. Доля скрытия слов в абзаце
const wordsFrac = 0.5;

// режим — 2. Доля скрытия строки
const halfFrac = 0.3;

// режим — 3. Ширина тёмной и светлой полосы относительно «0»
const zebraFillFrac = 1;
const zebraEmptyFrac = 4;

// режим — 4. Время скрытия пикселя
const vanishPaperPxDuration = 0.07;
// режим — 5. Задержка относительно символа
const vanishWordsCharDelay = 0.1;

function rand(from, to) {
	return Math.floor(from + Math.random() * (to + 1 - from));
}

function shuffle(array) {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);

		currentIndex--;

		[
			array[currentIndex],
			array[randomIndex]
		] = [
			array[randomIndex],
			array[currentIndex]
		];
	}
}

let variant;

let variants = fetch('./texts.json?' + Date.now());

variants
	.then(request => request.json())
	.then(_variants => {
		variants = _variants;

		variants.forEach((variant, i) => {
			const $variantFragment = templateVariant.cloneNode(true);

			const $variant = $variantFragment.querySelector('.variant');
			const $title = $variantFragment.querySelector('.variant__title');
			const $description = $variantFragment.querySelector('.variant__description');
			const $author = $variantFragment.querySelector('.variant__author');
			const $image = $variantFragment.querySelector('.variant__image');

			$variant.dataset.variant = i;
			$title.innerText = variant.title;
			$description.innerText = variant.description;
			$author.innerText = variant.author;
			$image.src = variant.image;

			$variantsList.append($variantFragment);
		});

		$variants.classList.remove('d-none');
	});

$variantsList.addEventListener('click', e => {
	const $variant = e.target.closest('.variant');

	if ($variant === null) {
		return;
	}

	variant = +$variant.dataset.variant;

	const data = variants[variant];
	const mode = rand(1, 5);

	$readingText.innerHTML = '';

	$readingText.classList.remove(
		'reading__text_words',
		'reading__text_half',
		'reading__text_zebra',
		'reading__text_vanish-paper',
		'reading__text_vanish-words'
	);

	if (
		mode === 1 ||
		mode === 4 ||
		mode === 5
	) {
		if (mode === 1) {
			$readingText.classList.add('reading__text_words');
		}

		else if (mode === 4) {
			$readingText.classList.add('reading__text_vanish-paper');
		}

		else {
			$readingText.classList.add('reading__text_vanish-words');
		}

		const $areas = $readingText.querySelectorAll('.area');

		$areas.forEach($area => {
			$area.remove();
		});
	}

	else if (mode === 2) {
		$readingText.classList.add('reading__text_half');
	}

	else {
		$readingText.classList.add('reading__text_zebra');

		const $readingUnit = document.createElement('span');

		$readingUnit.classList.add('d-block', 'visibility-hidden', 'reading__unit');
		$readingUnit.style.width = '1ch';

		$readingText.append($readingUnit);
	}

	let delay = 0;

	data.text.split('\n\n').map(p => {
		const $p = document.createElement('p');

		if (
			mode === 1 ||
			mode === 5
		) {
			let toWrap = [...p.matchAll(/({{)?[а-яёa-z\-]+(}})?/gi)];

			if (mode === 1) {
				shuffle(toWrap);

				toWrap = toWrap
					.filter(match => (
						!match[0].startsWith('{{') &&
						!match[0].endsWith('}}')
					))
					.slice(0, Math.floor(toWrap.length * wordsFrac));

				toWrap.sort((a, b) => {
					return a['index'] - b['index'];
				});
			}

			toWrap = toWrap.map(match => [
				match['index'],
				match['index'] + match[0].length
			]);

			let from = 0;

			let parts = [].concat(
				...toWrap.map((word, i) => {
					const prev = toWrap[i - 1] ?? [0, 0];

					const prevText = p.slice(prev[1], word[0])
						.replaceAll('{{', '')
						.replaceAll('}}', '');

					const areaText = p.slice(word[0], word[1])
						.replaceAll('{{', '')
						.replaceAll('}}', '');

					let lastText = '';

					if (i === toWrap.length - 1) {
						lastText = p.slice(word[1])
							.replaceAll('{{', '')
							.replaceAll('}}', '');
					}

					const $area = document.createElement('span');

					$area.innerText = areaText;

					if (mode === 1) {
						$area.classList.add('text-secondary', 'bg-secondary', 'area');
					}

					else {
						delay += vanishWordsCharDelay * areaText.length;

						$area.style.transitionDelay = delay + 's';

						setTimeout(() => {
							$area.classList.add('area', 'area_vanish-words');
						}, 0);
					}

					return [
						prevText,
						$area,
						lastText
					];
				})
			);

			$p.append(...parts);
		}

		else if (mode === 2) {
			const $span = document.createElement('span');

			$span.innerText = p
				.replaceAll('{{', '')
				.replaceAll('}}', '');

			$p.append($span);
		}

		else {
			$p.innerText = p
				.replaceAll('{{', '')
				.replaceAll('}}', '');
		}

		$readingText.append($p);
	});

	$variants.classList.add('d-none');
	$reading.classList.remove('d-none');

	if (mode === 4) {
		const $area = document.createElement('div');

		$area.style.left = 0;
		$area.style.right = 0;
		$area.style.top = 0;
		$area.style.bottom = '100%';

		$area.style.transitionDuration = vanishPaperPxDuration * $readingText.clientHeight + 's';

		$readingText.append($area);

		setTimeout(() => {
			$area.classList.add('position-absolute', 'text-secondary', 'bg-secondary', 'area', 'area_vanish-paper');
		});
	}

	window.dispatchEvent(
		new Event('resize')
	);
});

document.addEventListener('keydown', e => {
	if (
		!['Enter', 'Space'].includes(e.code) ||

		e.target.closest('input') !== null ||
		e.target.closest('button') !== null
	) {
		return;
	}

	if (!$reading.classList.contains('d-none')) {
		e.preventDefault();

		$readingCheck.click();
	}

	else if (
		!$questions.classList.contains('d-none') &&
		!$questionsBack.classList.contains('d-none')
	) {
		e.preventDefault();

		$questionsBack.click();
	}
});

$readingCheck.addEventListener('click', () => {
	const data = variants[variant];

	$questionsList.innerText = '';
	$questionsCheck.classList.remove('d-none');
	$questionsBack.classList.add('d-none');

	data.questions.forEach((question, i) => {
		if ('answers' in question) {
			const $questionFragment = templateChecks.cloneNode(true);

			const $question = $questionFragment.querySelector('.question');
			const $legend = $questionFragment.querySelector('.question__legend');

			$legend.innerText = question.text;

			question.answers.forEach((answer, j) => {
				const $answerFragment = templateCheck.cloneNode(true);

				const $input = $answerFragment.querySelector('.answer__input');
				const $label = $answerFragment.querySelector('.answer__label');

				$input.id = `q-${i}-a-${j}`;
				$input.value = j;

				$label.htmlFor = `q-${i}-a-${j}`;
				$label.innerText = answer;

				if (typeof question.correct === 'number') {
					$input.type = 'radio';
					$input.name = `q-${i}`;
				}

				else {
					$input.type = 'checkbox';
					$input.name = `q-${i}[]`;
				}

				$question.append($answerFragment);
			});

			$questionsList.append($question);
		}

		else {
			const $questionFragment = templateText.cloneNode(true);

			const $label = $questionFragment.querySelector('.question__label');
			const $input = $questionFragment.querySelector('.question__input');

			$input.id = `q-${i}`;
			$input.name = `q-${i}`;

			$label.innerText = question.text;
			$label.htmlFor = `q-${i}`;

			$questionsList.append($questionFragment);
		}
	});

	$reading.classList.add('d-none');
	$questions.classList.remove('d-none');
});

$questionsForm.addEventListener('submit', e => {
	e.preventDefault();

	const formData = new FormData($questionsForm);

	const data = variants[variant];

	data.questions.forEach((question, i) => {
		const $question = $questionsList.children[i];

		if ('answers' in question) {
			const $legend = $question.querySelector('.question__legend');

			const value = typeof question.correct === 'number'
				? formData.get(`q-${i}`)
				: formData.getAll(`q-${i}[]`).join(',');

			const correct = question.correct.toString();

			$legend.classList.add(
				value === correct
					? 'text-success'
					: 'text-danger'
			);

			$question.disabled = true;
		}

		else {
			const $label = $question.querySelector('.question__label');
			const $input = $question.querySelector('.question__input');

			const value = formData.get(`q-${i}`).toLocaleLowerCase();
			const correct = question.correct.map(item => item.toLocaleLowerCase());

			$label.classList.add(
				correct.includes(value)
					? 'text-success'
					: 'text-danger'
			);

			$input.disabled = true;
		}
	});

	$questionsCheck.classList.add('d-none');
	$questionsBack.classList.remove('d-none');
});

$questionsBack.addEventListener('click', e => {
	$questions.classList.add('d-none');
	$variants.classList.remove('d-none');
});

window.addEventListener('resize', () => {
	if (
		$reading.classList.contains('d-none') ||

		$readingText.classList.contains('reading__text_words') ||
		$readingText.classList.contains('reading__text_vanish-paper') ||
		$readingText.classList.contains('reading__text_vanish-words')
	) {
		return;
	}

	const $areas = $readingText.querySelectorAll('.area');

	$areas.forEach($area => {
		$area.remove();
	});

	if ($readingText.classList.contains('reading__text_half')) {
		const rects = [].concat(
			...[...$readingText.querySelectorAll('span')]
				.map($span => [...$span.getClientRects()])
		);

		rects.forEach(rect => {
			const $area = document.createElement('div');

			$area.classList.add('position-absolute', 'bg-secondary', 'area');

			const {top, left} = $readingText.getBoundingClientRect();

			$area.style.top = (rect.top + rect.height * (1 - halfFrac) - top) + 'px';
			$area.style.left = (rect.left - left) + 'px';
			$area.style.width = rect.width + 'px';
			$area.style.height = (rect.height * halfFrac) + 'px';

			$readingText.append($area);
		});
	}

	else {
		const $readingUnit = $readingText.querySelector('.reading__unit');

		const width = $readingText.clientWidth;
		const unit = $readingUnit.clientWidth;

		const a = unit * zebraFillFrac;
		const b = unit * zebraEmptyFrac;

		let left = 0;

		while (true) {
			const $area = document.createElement('div');

			$area.classList.add('position-absolute', 'bg-secondary', 'area');

			if (left + a > width) {
				break;
			}

			$area.style.top = 0;
			$area.style.bottom = 0;
			$area.style.left = left + 'px';
			$area.style.width = a + 'px';

			left = left + a + b;

			$readingText.append($area);
		}
	}
});
