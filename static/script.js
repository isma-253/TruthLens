const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const uploadContent = document.getElementById('uploadContent');
const previewWrapper = document.getElementById('previewWrapper');
const imagePreview = document.getElementById('imagePreview');
const fileName = document.getElementById('fileName');
const imageDimensions = document.getElementById('imageDimensions');
const fileSize = document.getElementById('fileSize');
const fileActions = document.getElementById('fileActions');
const errorMessage = document.getElementById('errorMessage');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingMessage = document.getElementById('loadingMessage');
const resultSection = document.getElementById('resultSection');
const predictionBadge = document.getElementById('predictionBadge');
const predictionText = document.getElementById('predictionText');
const confidenceValue = document.getElementById('confidenceValue');
const confidenceText = document.getElementById('confidenceText');
const confidenceBar = document.getElementById('confidenceBar');
const resultExplanation = document.getElementById('resultExplanation');
const confidenceDisclaimer = document.getElementById('confidenceDisclaimer');
const resultImage = document.getElementById('resultImage');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const changeImageBtn = document.getElementById('changeImageBtn');
const removeImageBtn = document.getElementById('removeImageBtn');
const tryAnotherBtn = document.getElementById('tryAnotherBtn');

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg'];

const state = {
  selectedFile: null,
  selectedImageUrl: '',
  analyzing: false,
};

function setError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = '';
}

function updateAnalyzeButtonState() {
  const isReady = Boolean(state.selectedFile);
  analyzeBtn.disabled = !isReady || state.analyzing;

  const btnText = analyzeBtn.querySelector('.btn-text');
  const spinner = analyzeBtn.querySelector('.spinner');

  if (state.analyzing) {
    btnText.textContent = 'Analyzing...';
    spinner.classList.remove('hidden');
    loadingMessage.classList.remove('hidden');
  } else {
    btnText.textContent = 'Analyze Image';
    spinner.classList.add('hidden');
    loadingMessage.classList.add('hidden');
  }
}

function showPreview(file, objectUrl) {
  uploadContent.classList.add('hidden');
  previewWrapper.classList.remove('hidden');
  fileActions.classList.remove('hidden');

  imagePreview.src = objectUrl;
  resultImage.src = objectUrl;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  const image = new Image();
  image.onload = () => {
    imageDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
  };
  image.src = objectUrl;
}

function resetUploadUI() {
  if (state.selectedImageUrl) {
    URL.revokeObjectURL(state.selectedImageUrl);
  }

  state.selectedFile = null;
  state.selectedImageUrl = '';

  imageInput.value = '';
  uploadContent.classList.remove('hidden');
  previewWrapper.classList.add('hidden');
  fileActions.classList.add('hidden');
  imagePreview.src = '';
  resultImage.src = '';
  fileName.textContent = '';
  imageDimensions.textContent = '0 × 0';
  fileSize.textContent = '0 KB';

  clearError();
  updateAnalyzeButtonState();
}

function startFreshAnalysis() {
  resetUploadUI();
  resultSection.classList.add('hidden');
  openFilePicker();
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1048576).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!file) {
    setError('Please choose a valid image file.');
    return false;
  }

  const extensionIsValid = /\.(jpe?g)$/i.test(file.name);
  const mimeIsValid = ALLOWED_TYPES.includes(file.type.toLowerCase());

  if (!extensionIsValid && !mimeIsValid) {
    setError('Only JPG and JPEG files are supported.');
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    setError('File size must be 8 MB or less.');
    return false;
  }

  return true;
}

function handleSelectedFile(file) {
  if (!validateFile(file)) {
    return;
  }

  clearError();

  if (state.selectedImageUrl) {
    URL.revokeObjectURL(state.selectedImageUrl);
  }

  const objectUrl = URL.createObjectURL(file);
  state.selectedFile = file;
  state.selectedImageUrl = objectUrl;
  showPreview(file, objectUrl);
  updateAnalyzeButtonState();
}

function openFilePicker() {
  imageInput.click();
}

function updatePredictionUI(prediction, confidence) {
  const normalizedPrediction = String(prediction).toUpperCase();
  const normalizedConfidence = Number(confidence) || 0;

  predictionBadge.textContent = normalizedPrediction;
  predictionBadge.classList.toggle('prediction-real', normalizedPrediction === 'REAL');
  predictionBadge.classList.toggle('prediction-fake', normalizedPrediction === 'FAKE');

  predictionText.textContent = normalizedPrediction;
  confidenceValue.textContent = `${normalizedConfidence.toFixed(1)}%`;
  confidenceText.textContent = `${normalizedConfidence.toFixed(1)}%`;
  confidenceBar.style.width = `${Math.min(Math.max(normalizedConfidence, 0), 100)}%`;

  if (normalizedPrediction === 'REAL') {
    resultExplanation.textContent = `Model Confidence: ${normalizedConfidence.toFixed(1)}%. The image appears consistent with natural photographic characteristics.`;
  } else {
    resultExplanation.textContent = `Model Confidence: ${normalizedConfidence.toFixed(1)}%. The image shows signs associated with synthetic generation patterns.`;
  }

  if (confidenceDisclaimer) {
    confidenceDisclaimer.textContent = "Model Confidence is the model's confidence in its prediction and does not represent guaranteed accuracy.";
  }
}

async function analyzeImage() {
  if (!state.selectedFile || state.analyzing) {
    return;
  }

  state.analyzing = true;
  updateAnalyzeButtonState();
  clearError();
  resultSection.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('image', state.selectedFile, state.selectedFile.name);

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Prediction failed. Please try again.');
    }

    if (!data.prediction || typeof data.confidence !== 'number') {
      throw new Error('The server response was invalid.');
    }

    updatePredictionUI(data.prediction, data.confidence);
    resultSection.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    setError(error.message || 'Unable to analyze this image right now. Please try a different JPG/JPEG or check that the backend is running.');
  } finally {
    state.analyzing = false;
    updateAnalyzeButtonState();
  }
}

uploadArea.addEventListener('click', (event) => {
  if (event.target.closest('#removeImageBtn') || event.target.closest('#changeImageBtn')) {
    return;
  }

  if (!state.selectedFile) {
    openFilePicker();
  }
});

uploadArea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openFilePicker();
  }
});

imageInput.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) {
    handleSelectedFile(file);
  }
});

['dragenter', 'dragover'].forEach((eventName) => {
  uploadArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  uploadArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
  });
});

uploadArea.addEventListener('drop', (event) => {
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) {
    handleSelectedFile(file);
  }
});

removeImageBtn.addEventListener('click', () => {
  resetUploadUI();
  resultSection.classList.add('hidden');
});

tryAnotherBtn.addEventListener('click', () => {
  startFreshAnalysis();
});

changeImageBtn.addEventListener('click', () => {
  openFilePicker();
});

analyzeBtn.addEventListener('click', analyzeImage);

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

resetUploadUI();
