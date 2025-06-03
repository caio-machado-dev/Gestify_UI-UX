// Global variables
let selectedDoctorId = null
let selectedAppointmentId = null
const navigationHistory = ["landing-page"] // Track navigation history
let selectedHistoryId = null

// Page Management with History
function showPage(pageId) {
  // Add current page to history if it's different from the last one
  const currentPage = document.querySelector(".page.active")?.id
  if (currentPage && currentPage !== pageId && navigationHistory[navigationHistory.length - 1] !== currentPage) {
    navigationHistory.push(currentPage)
  }

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
  document.getElementById(pageId).classList.add("active")

  // Update logo click functionality
  updateLogoNavigation()
}

function updateLogoNavigation() {
  const logos = document.querySelectorAll(".logo")
  logos.forEach((logo) => {
    logo.style.cursor = "pointer"
    logo.onclick = goBack
  })
}

function goBack() {
  if (navigationHistory.length > 1) {
    navigationHistory.pop() // Remove current page
    const previousPage = navigationHistory[navigationHistory.length - 1]
    showPage(previousPage)
  } else {
    showLanding()
  }
}

function showLanding() {
  showPage("landing-page")
}

function showLogin() {
  showPage("login-page")
}

function showRegisterOptions() {
  showPage("register-options")
}

function showRegister(type) {
  if (type === "patient") {
    showPage("patient-register")
  } else if (type === "doctor") {
    showPage("doctor-register")
  }
}

function showSearch() {
  showPage("search-page")
  loadAllDoctors()
}

function showDoctorProfile(doctorId) {
  selectedDoctorId = doctorId
  showPage("doctor-profile")
  loadDoctorProfile(doctorId)
}

function showAppointmentBooking() {
  showPage("appointment-booking")
  setupAppointmentForm()
}

function showRating(appointmentId) {
  selectedAppointmentId = appointmentId
  showPage("rating-page")
  setupRatingForm(appointmentId)
}

function showEditProfile() {
  showPage("edit-profile")
  loadEditProfile()
}

function showAddMedicalRecord(appointmentId) {
  selectedAppointmentId = appointmentId
  showPage("add-medical-record")
  loadAddMedicalRecordForm(appointmentId)
}

function showHealthCharts() {
  showPage("health-charts")
  loadHealthCharts()
}

function showDashboard() {
  showPage("dashboard")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  if (currentUser) {
    document.getElementById("user-welcome").textContent = `Olá, ${currentUser.name}!`

    if (currentUser.type === "patient") {
      document.getElementById("patient-dashboard").style.display = "block"
      document.getElementById("doctor-dashboard").style.display = "none"
      loadPatientAppointments()
      loadMedicalHistory()
      loadNotifications()
    } else if (currentUser.type === "doctor") {
      document.getElementById("patient-dashboard").style.display = "none"
      document.getElementById("doctor-dashboard").style.display = "block"
      updateDoctorStats()
      loadDoctorAppointments()
      loadNotifications()
    }
  }
}

// Popup System
function createPopup(type, title, message, buttons = null) {
  // Remove existing popup if any
  const existingPopup = document.querySelector(".popup-overlay")
  if (existingPopup) {
    existingPopup.remove()
  }

  const overlay = document.createElement("div")
  overlay.className = "popup-overlay"

  const popup = document.createElement("div")
  popup.className = "popup"

  const iconClass = {
    success: "fas fa-check-circle",
    error: "fas fa-times-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  popup.innerHTML = `
    <div class="popup-icon ${type}">
      <i class="${iconClass[type]}"></i>
    </div>
    <h3>${title}</h3>
    <p>${message}</p>
    <div class="popup-buttons">
      ${buttons || `<button class="popup-btn primary" onclick="closePopup()">OK</button>`}
    </div>
  `

  overlay.appendChild(popup)
  document.body.appendChild(overlay)

  // Show popup with animation
  setTimeout(() => overlay.classList.add("active"), 10)

  // Auto close success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => closePopup(), 3000)
  }

  // Close on ESC key
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closePopup()
      document.removeEventListener("keydown", escHandler)
    }
  })

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup()
    }
  })
}

function closePopup() {
  const overlay = document.querySelector(".popup-overlay")
  if (overlay) {
    overlay.classList.remove("active")
    setTimeout(() => overlay.remove(), 300)
  }
}

function showSuccessPopup(title, message) {
  createPopup("success", title, message)
}

function showErrorPopup(title, message) {
  createPopup("error", title, message)
}

function showWarningPopup(title, message) {
  createPopup("warning", title, message)
}

function showInfoPopup(title, message) {
  createPopup("info", title, message)
}

function showConfirmPopup(title, message, onConfirm, onCancel = null) {
  const buttons = `
    <button class="popup-btn secondary" onclick="closePopup(); ${onCancel ? onCancel + "()" : ""}">Cancelar</button>
    <button class="popup-btn primary" onclick="closePopup(); ${onConfirm}()">Confirmar</button>
  `
  createPopup("warning", title, message, buttons)
}

// Notification System
function createNotification(userId, type, title, message, relatedId = null) {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || []
  const notification = {
    id: Date.now().toString(),
    userId: userId,
    type: type, // 'medical_record', 'appointment', 'general'
    title: title,
    message: message,
    relatedId: relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  }

  notifications.push(notification)
  localStorage.setItem("notifications", JSON.stringify(notifications))

  // Update notification badge
  updateNotificationBadge(userId)
}

function loadNotifications() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const notifications = getNotificationsForUser(currentUser.id)

  // Update notification badge
  updateNotificationBadge(currentUser.id)
}

function getNotificationsForUser(userId) {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || []
  return notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function updateNotificationBadge(userId) {
  const notifications = getNotificationsForUser(userId)
  const unreadCount = notifications.filter((n) => !n.read).length

  // Update badge in header if exists
  let badge = document.querySelector(".notification-badge")
  if (!badge && unreadCount > 0) {
    badge = document.createElement("span")
    badge.className = "notification-badge"
    const welcomeSpan = document.getElementById("user-welcome")
    if (welcomeSpan) {
      welcomeSpan.appendChild(badge)
    }
  }

  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount
      badge.style.display = "inline-block"
    } else {
      badge.style.display = "none"
    }
  }
}

function markNotificationAsRead(notificationId) {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || []
  const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

  if (notificationIndex !== -1) {
    notifications[notificationIndex].read = true
    localStorage.setItem("notifications", JSON.stringify(notifications))

    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    updateNotificationBadge(currentUser.id)
  }
}

function showNotifications() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const notifications = getNotificationsForUser(currentUser.id)

  if (notifications.length === 0) {
    showInfoPopup("Notificações", "Você não tem notificações no momento.")
    return
  }

  const notificationsList = notifications
    .slice(0, 5)
    .map(
      (notification) => `
    <div class="notification-item ${notification.read ? "read" : "unread"}" onclick="handleNotificationClick('${notification.id}', '${notification.type}', '${notification.relatedId}')">
      <div class="notification-header">
        <strong>${notification.title}</strong>
        <span class="notification-date">${new Date(notification.createdAt).toLocaleDateString()}</span>
      </div>
      <p>${notification.message}</p>
    </div>
  `,
    )
    .join("")

  const buttons = `
    <button class="popup-btn secondary" onclick="markAllNotificationsAsRead()">Marcar Todas como Lidas</button>
    <button class="popup-btn primary" onclick="closePopup()">Fechar</button>
  `

  createPopup("info", "Notificações", `<div class="notifications-list">${notificationsList}</div>`, buttons)
}

function handleNotificationClick(notificationId, type, relatedId) {
  markNotificationAsRead(notificationId)
  closePopup()

  if (type === "medical_record" && relatedId) {
    showRecordDetails(relatedId)
  } else if (type === "appointment" && relatedId) {
    showDashboard()
  }
}

function markAllNotificationsAsRead() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const notifications = JSON.parse(localStorage.getItem("notifications")) || []

  notifications.forEach((notification) => {
    if (notification.userId === currentUser.id) {
      notification.read = true
    }
  })

  localStorage.setItem("notifications", JSON.stringify(notifications))
  updateNotificationBadge(currentUser.id)
  closePopup()
  showSuccessPopup("Notificações", "Todas as notificações foram marcadas como lidas.")
}

// Search Functions
function searchDoctors() {
  const specialty = document.getElementById("search-specialty").value

  const doctors = getDoctors()
  let filteredDoctors = doctors

  if (specialty) {
    filteredDoctors = filteredDoctors.filter((doctor) => doctor.specialty === specialty)
  }
  displaySearchResults(filteredDoctors)
}

function loadAllDoctors() {
  const doctors = getDoctors()
  displaySearchResults(doctors)
}

function displaySearchResults(doctors) {
  const resultsContainer = document.getElementById("search-results")

  if (doctors.length === 0) {
    resultsContainer.innerHTML = '<p class="no-results">Nenhum médico encontrado.</p>'
    return
  }

  resultsContainer.innerHTML = doctors
    .map((doctor) => {
      const stats = getDoctorStats(doctor.id)
      const profilePicture = doctor.profilePicture || "/placeholder.svg?height=80&width=80"
      return `
      <div class="doctor-search-card">
        <div class="doctor-photo">
          <img src="${profilePicture}" alt="Foto do Dr(a) ${doctor.name}" class="doctor-profile-img">
        </div>
        <div class="doctor-search-info">
          <h3>Dr(a) ${doctor.name} ${doctor.surname}</h3>
          <p class="specialty">${getSpecialtyName(doctor.specialty)}</p>
          <p class="rating">${stats.averageRating.toFixed(1)} ⭐ (${stats.totalRatings} avaliações)</p>
          <p class="price">A partir de R$ ${doctor.basePrice || 100}</p>
        </div>
        <div class="doctor-search-actions">
          <button class="btn-contact" onclick="showDoctorProfile('${doctor.id}')">Ver Perfil</button>
          <button class="btn-primary" onclick="showDoctorProfile('${doctor.id}')">Agendar</button>
        </div>
      </div>
    `
    })
    .join("")
}

function loadDoctorProfile(doctorId) {
  const doctor = getDoctors().find((d) => d.id === doctorId)
  if (!doctor) return

  const stats = getDoctorStats(doctorId)
  const ratings = getRatingsForDoctor(doctorId)
  const profilePicture = doctor.profilePicture || "/placeholder.svg?height=150&width=150"

  document.getElementById("doctor-profile-content").innerHTML = `
    <div class="doctor-profile-card">
      <div class="doctor-profile-header">
        <img src="${profilePicture}" alt="Foto do Dr(a) ${doctor.name}" class="doctor-profile-main-img">
        <h2>Dr(a) ${doctor.name} ${doctor.surname}</h2>
        <p class="specialty">${getSpecialtyName(doctor.specialty)}</p>
        <p class="crm">${doctor.crm}</p>
      </div>
      
      <div class="doctor-profile-stats">
        <div class="profile-stat">
          <div class="stat-label">Avaliação</div>
          <div class="stat-value">${stats.averageRating.toFixed(1)} ⭐</div>
        </div>
        <div class="profile-stat">
          <div class="stat-label">Consultas</div>
          <div class="stat-value">${stats.totalAppointments}</div>
        </div>
        <div class="profile-stat">
          <div class="stat-label">Pacientes</div>
          <div class="stat-value">${stats.totalPatients}</div>
        </div>
      </div>
      
      <div class="doctor-profile-services">
        <h3>Serviços Oferecidos</h3>
        <div class="services-grid">
          <div class="service-card">
            <h4>Consulta Presencial</h4>
            <p class="service-price">R$ ${doctor.basePrice || 100}</p>
          </div>
          <div class="service-card">
            <h4>Teleconsulta</h4>
            <p class="service-price">R$ ${Math.round((doctor.basePrice || 100) * 0.8)}</p>
          </div>
        </div>
      </div>
      
      <div class="profile-actions">
        <button class="btn-cta" onclick="showAppointmentBooking()">Agendar Consulta</button>
      </div>
      
      <div class="doctor-ratings">
        <h3>Avaliações Recentes</h3>
        ${ratings
          .slice(0, 3)
          .map(
            (rating) => `
          <div class="rating-card">
            <div class="rating-header">
              <span class="rating-stars">${"⭐".repeat(rating.rating)}</span>
              <span class="rating-date">${new Date(rating.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="rating-comment">${rating.comment}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `
}

// Appointment Functions with Time Validation
function setupAppointmentForm() {
  const form = document.getElementById("appointment-form")
  const dateInput = document.getElementById("appointment-date")
  const timeSelect = document.getElementById("appointment-time")

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  dateInput.min = today

  // Add event listener to date change to update available times
  dateInput.addEventListener("change", updateAvailableTimes)

  // Initial load of available times
  updateAvailableTimes()

  form.onsubmit = (e) => {
    e.preventDefault()
    if (validateAppointmentTime()) {
      bookAppointment()
    }
  }
}

function updateAvailableTimes() {
  const dateInput = document.getElementById("appointment-date")
  const timeSelect = document.getElementById("appointment-time")
  const selectedDate = dateInput.value

  if (!selectedDate) return

  const today = new Date().toISOString().split("T")[0]
  const currentTime = new Date()
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()

  // All available time slots
  const allTimes = [
    { value: "08:00", label: "08:00" },
    { value: "09:00", label: "09:00" },
    { value: "10:00", label: "10:00" },
    { value: "11:00", label: "11:00" },
    { value: "14:00", label: "14:00" },
    { value: "15:00", label: "15:00" },
    { value: "16:00", label: "16:00" },
    { value: "17:00", label: "17:00" },
  ]

  // Clear current options
  timeSelect.innerHTML = '<option value="">Selecione um horário</option>'

  // Filter times based on date
  const availableTimes = allTimes.filter((time) => {
    if (selectedDate === today) {
      // For today, only show times that haven't passed
      const timeHour = Number.parseInt(time.value.split(":")[0])
      const timeMinute = Number.parseInt(time.value.split(":")[1])

      // Add 1 hour buffer for booking
      if (timeHour < currentHour || (timeHour === currentHour && timeMinute <= currentMinute)) {
        return false
      }
    }
    return true
  })

  // Add available times to select
  availableTimes.forEach((time) => {
    const option = document.createElement("option")
    option.value = time.value
    option.textContent = time.label
    timeSelect.appendChild(option)
  })

  // Show message if no times available
  if (availableTimes.length === 0) {
    const option = document.createElement("option")
    option.value = ""
    option.textContent = "Nenhum horário disponível para hoje"
    option.disabled = true
    timeSelect.appendChild(option)
  }
}

function validateAppointmentTime() {
  const selectedDate = document.getElementById("appointment-date").value
  const selectedTime = document.getElementById("appointment-time").value

  if (!selectedDate || !selectedTime) {
    showErrorPopup("Dados Incompletos", "Por favor, selecione data e horário para a consulta.")
    return false
  }

  const today = new Date().toISOString().split("T")[0]
  const currentTime = new Date()

  if (selectedDate === today) {
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const selectedDateTime = new Date()
    selectedDateTime.setHours(hours, minutes, 0, 0)

    // Check if selected time is in the past (with 1 hour buffer)
    const oneHourFromNow = new Date(currentTime.getTime() + 60 * 60 * 1000)

    if (selectedDateTime <= oneHourFromNow) {
      showErrorPopup(
        "Horário Inválido",
        "Não é possível agendar consultas para horários que já passaram ou com menos de 1 hora de antecedência.",
      )
      return false
    }
  }

  return true
}

function bookAppointment() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const doctor = getDoctors().find((d) => d.id === selectedDoctorId)

  const appointmentData = {
    id: Date.now().toString(),
    patientId: currentUser.id,
    doctorId: selectedDoctorId,
    patientName: `${currentUser.name} ${currentUser.surname}`,
    doctorName: `${doctor.name} ${doctor.surname}`,
    date: document.getElementById("appointment-date").value,
    time: document.getElementById("appointment-time").value,
    type: document.getElementById("appointment-type").value,
    notes: document.getElementById("appointment-notes").value,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  const appointments = JSON.parse(localStorage.getItem("appointments")) || []
  appointments.push(appointmentData)
  localStorage.setItem("appointments", JSON.stringify(appointments))

  showSuccessPopup("Consulta Agendada", "Sua consulta foi agendada com sucesso! O médico receberá a solicitação.")
  setTimeout(() => showDashboard(), 2000)
}

// Medical Record Functions
function loadAddMedicalRecordForm(appointmentId) {
  const appointment = getAppointmentById(appointmentId)
  if (!appointment) return

  document.getElementById("add-medical-record-content").innerHTML = `
    <div class="medical-record-form">
      <h2>Adicionar Registro Médico</h2>
      <div class="appointment-info">
        <h3>Consulta: ${appointment.patientName}</h3>
        <p>Data: ${new Date(appointment.date).toLocaleDateString()} às ${appointment.time}</p>
        <p>Tipo: ${appointment.type}</p>
      </div>
      
      <form id="medical-record-form">
        <div class="form-group">
          <label for="record-title">Título do Registro</label>
          <input type="text" id="record-title" required placeholder="Ex: Consulta de Rotina, Avaliação Cardiológica">
        </div>
        
        <div class="form-group">
          <label for="record-diagnosis">Diagnóstico</label>
          <textarea id="record-diagnosis" rows="3" required placeholder="Descreva o diagnóstico principal"></textarea>
        </div>
        
        <div class="form-group">
          <label for="record-notes">Observações Médicas</label>
          <textarea id="record-notes" rows="4" required placeholder="Observações detalhadas sobre a consulta"></textarea>
        </div>
        
        <div class="form-group">
          <label for="record-prescription">Prescrição (Opcional)</label>
          <textarea id="record-prescription" rows="3" placeholder="Medicamentos prescritos e instruções"></textarea>
        </div>
        
        <div class="form-group">
          <label for="record-exams">Exames Solicitados (Opcional)</label>
          <textarea id="record-exams" rows="2" placeholder="Liste os exames solicitados, separados por vírgula"></textarea>
        </div>
        
        <div class="form-group">
          <label for="record-location">Local da Consulta</label>
          <input type="text" id="record-location" placeholder="Ex: Clínica Central - São Paulo">
        </div>
        
        <div class="form-group">
          <label for="exam-files">Upload de Resultados de Exames</label>
          <input type="file" id="exam-files" multiple accept=".pdf,.jpg,.jpeg,.png" class="file-input">
          <div class="file-upload-info">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Clique para selecionar arquivos ou arraste aqui</p>
            <small>Formatos aceitos: PDF, JPG, PNG (máx. 5MB cada)</small>
          </div>
          <div id="uploaded-files" class="uploaded-files"></div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="showDashboard()">Cancelar</button>
          <button type="submit" class="btn-submit">Salvar Registro</button>
        </div>
      </form>
    </div>
  `

  // Setup file upload
  setupFileUpload()

  // Setup form submission
  document.getElementById("medical-record-form").onsubmit = (e) => {
    e.preventDefault()
    saveMedicalRecord(appointmentId)
  }
}

function setupFileUpload() {
  const fileInput = document.getElementById("exam-files")
  const uploadInfo = document.querySelector(".file-upload-info")
  const uploadedFilesDiv = document.getElementById("uploaded-files")

  // Click to upload
  uploadInfo.addEventListener("click", () => {
    fileInput.click()
  })

  // Drag and drop
  uploadInfo.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadInfo.classList.add("drag-over")
  })

  uploadInfo.addEventListener("dragleave", () => {
    uploadInfo.classList.remove("drag-over")
  })

  uploadInfo.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadInfo.classList.remove("drag-over")
    const files = e.dataTransfer.files
    handleFileSelection(files)
  })

  fileInput.addEventListener("change", (e) => {
    handleFileSelection(e.target.files)
  })

  function handleFileSelection(files) {
    uploadedFilesDiv.innerHTML = ""

    Array.from(files).forEach((file, index) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showErrorPopup("Arquivo muito grande", `O arquivo ${file.name} excede o limite de 5MB.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const fileDiv = document.createElement("div")
        fileDiv.className = "uploaded-file"
        fileDiv.innerHTML = `
          <div class="file-info">
            <i class="fas ${getFileIcon(file.type)}"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button type="button" class="remove-file" onclick="removeFile(${index})">
            <i class="fas fa-times"></i>
          </button>
        `
        uploadedFilesDiv.appendChild(fileDiv)
      }
      reader.readAsDataURL(file)
    })
  }

  function getFileIcon(fileType) {
    if (fileType.includes("pdf")) return "fa-file-pdf"
    if (fileType.includes("image")) return "fa-file-image"
    return "fa-file"
  }

  window.removeFile = (index) => {
    const fileInput = document.getElementById("exam-files")
    const dt = new DataTransfer()
    const files = Array.from(fileInput.files)

    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file)
      }
    })

    fileInput.files = dt.files
    handleFileSelection(fileInput.files)
  }
}

function saveMedicalRecord(appointmentId) {
  const appointment = getAppointmentById(appointmentId)
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const fileInput = document.getElementById("exam-files")

  // Process uploaded files
  const uploadedFiles = []
  Array.from(fileInput.files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
      })
    }
    reader.readAsDataURL(file)
  })

  const examsText = document.getElementById("record-exams").value
  const exams = examsText
    ? examsText
        .split(",")
        .map((exam) => exam.trim())
        .filter((exam) => exam)
    : []

  const recordData = {
    id: Date.now().toString(),
    patientId: appointment.patientId,
    doctorId: currentUser.id,
    appointmentId: appointmentId,
    doctorName: `${currentUser.name} ${currentUser.surname}`,
    specialty: currentUser.specialty,
    title: document.getElementById("record-title").value,
    date: appointment.date,
    type: appointment.type,
    diagnosis: document.getElementById("record-diagnosis").value,
    notes: document.getElementById("record-notes").value,
    prescription: document.getElementById("record-prescription").value,
    location: document.getElementById("record-location").value,
    exams: exams,
    examFiles: uploadedFiles,
    createdAt: new Date().toISOString(),
  }

  const medicalHistory = JSON.parse(localStorage.getItem("medicalHistory")) || []
  medicalHistory.push(recordData)
  localStorage.setItem("medicalHistory", JSON.stringify(medicalHistory))

  // Create notification for patient
  createNotification(
    appointment.patientId,
    "medical_record",
    "Novo Registro Médico",
    `Dr(a) ${currentUser.name} ${currentUser.surname} adicionou um novo registro médico: ${recordData.title}`,
    recordData.id,
  )

  showSuccessPopup("Registro Salvo", "O registro médico foi salvo com sucesso e o paciente foi notificado.")
  setTimeout(() => showDashboard(), 2000)
}

// Health Charts Functions
function loadHealthCharts() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const medicalHistory = getMedicalHistoryForPatient(currentUser.id)

  document.getElementById("health-charts-content").innerHTML = `
    <div class="health-charts-container">
      <h2>Visualização de Dados de Saúde</h2>
      
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Consultas por Especialidade</h3>
          <div class="chart-container">
            <canvas id="specialty-chart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3>Consultas ao Longo do Tempo</h3>
          <div class="chart-container">
            <canvas id="timeline-chart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3>Tipos de Consulta</h3>
          <div class="chart-container">
            <canvas id="type-chart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3>Resumo de Saúde</h3>
          <div class="health-summary">
            <div class="summary-item">
              <div class="summary-label">Total de Consultas</div>
              <div class="summary-value">${medicalHistory.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Especialidades Visitadas</div>
              <div class="summary-value">${new Set(medicalHistory.map((r) => r.specialty)).size}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Última Consulta</div>
              <div class="summary-value">${medicalHistory.length > 0 ? new Date(medicalHistory[0].date).toLocaleDateString() : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-actions">
        <button class="btn-secondary" onclick="showDashboard()">Voltar</button>
        <button class="btn-primary" onclick="exportHealthData()">
          <i class="fas fa-download"></i> Exportar Dados
        </button>
      </div>
    </div>
  `

  // Generate charts
  generateSpecialtyChart(medicalHistory)
  generateTimelineChart(medicalHistory)
  generateTypeChart(medicalHistory)
}

function generateSpecialtyChart(medicalHistory) {
  const canvas = document.getElementById("specialty-chart")
  const ctx = canvas.getContext("2d")

  // Count consultations by specialty
  const specialtyCount = {}
  medicalHistory.forEach((record) => {
    const specialty = getSpecialtyName(record.specialty)
    specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1
  })

  const specialties = Object.keys(specialtyCount)
  const counts = Object.values(specialtyCount)

  // Simple bar chart implementation
  drawBarChart(ctx, canvas, specialties, counts, "Consultas")
}

function generateTimelineChart(medicalHistory) {
  const canvas = document.getElementById("timeline-chart")
  const ctx = canvas.getContext("2d")

  // Group by month
  const monthlyCount = {}
  medicalHistory.forEach((record) => {
    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
  })

  const months = Object.keys(monthlyCount).sort()
  const counts = months.map((month) => monthlyCount[month])

  // Simple line chart implementation
  drawLineChart(ctx, canvas, months, counts, "Consultas por Mês")
}

function generateTypeChart(medicalHistory) {
  const canvas = document.getElementById("type-chart")
  const ctx = canvas.getContext("2d")

  // Count by type
  const typeCount = {}
  medicalHistory.forEach((record) => {
    typeCount[record.type] = (typeCount[record.type] || 0) + 1
  })

  const types = Object.keys(typeCount)
  const counts = Object.values(typeCount)
  const colors = ["#2c5aa0", "#27ae60", "#e74c3c", "#f39c12"]

  // Simple pie chart implementation
  drawPieChart(ctx, canvas, types, counts, colors)
}

function drawBarChart(ctx, canvas, labels, data, title) {
  const padding = 40
  const chartWidth = canvas.width - 2 * padding
  const chartHeight = canvas.height - 2 * padding

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (data.length === 0) {
    ctx.fillStyle = "#666"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Nenhum dado disponível", canvas.width / 2, canvas.height / 2)
    return
  }

  const maxValue = Math.max(...data)
  const barWidth = (chartWidth / labels.length) * 0.8
  const barSpacing = (chartWidth / labels.length) * 0.2

  // Draw bars
  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * chartHeight
    const x = padding + index * (barWidth + barSpacing)
    const y = canvas.height - padding - barHeight

    ctx.fillStyle = "#2c5aa0"
    ctx.fillRect(x, y, barWidth, barHeight)

    // Draw value on top
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(value, x + barWidth / 2, y - 5)

    // Draw label
    ctx.save()
    ctx.translate(x + barWidth / 2, canvas.height - 10)
    ctx.rotate(-Math.PI / 4)
    ctx.textAlign = "right"
    ctx.fillText(labels[index], 0, 0)
    ctx.restore()
  })
}

function drawLineChart(ctx, canvas, labels, data, title) {
  const padding = 40
  const chartWidth = canvas.width - 2 * padding
  const chartHeight = canvas.height - 2 * padding

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (data.length === 0) {
    ctx.fillStyle = "#666"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Nenhum dado disponível", canvas.width / 2, canvas.height / 2)
    return
  }

  const maxValue = Math.max(...data)
  const stepX = chartWidth / (labels.length - 1)

  // Draw line
  ctx.strokeStyle = "#2c5aa0"
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((value, index) => {
    const x = padding + index * stepX
    const y = canvas.height - padding - (value / maxValue) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    // Draw points
    ctx.fillStyle = "#2c5aa0"
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()

    // Draw value
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(value, x, y - 10)
  })

  ctx.stroke()
}

function drawPieChart(ctx, canvas, labels, data, colors) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 20

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (data.length === 0) {
    ctx.fillStyle = "#666"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Nenhum dado disponível", centerX, centerY)
    return
  }

  const total = data.reduce((sum, value) => sum + value, 0)
  let currentAngle = -Math.PI / 2

  data.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI

    // Draw slice
    ctx.fillStyle = colors[index % colors.length]
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fill()

    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2
    const labelX = centerX + Math.cos(labelAngle) * (radius + 20)
    const labelY = centerY + Math.sin(labelAngle) * (radius + 20)

    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${labels[index]} (${value})`, labelX, labelY)

    currentAngle += sliceAngle
  })
}

function exportHealthData() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const medicalHistory = getMedicalHistoryForPatient(currentUser.id)

  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Data,Título,Médico,Especialidade,Diagnóstico,Tipo\n" +
    medicalHistory
      .map(
        (record) =>
          `"${new Date(record.date).toLocaleDateString()}","${record.title}","${record.doctorName}","${getSpecialtyName(record.specialty)}","${record.diagnosis}","${record.type}"`,
      )
      .join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `historico_medico_${currentUser.name}_${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showSuccessPopup("Dados Exportados", "Seus dados de saúde foram exportados com sucesso!")
}

// Print Functions
function printMedicalRecord(recordId) {
  const record = getMedicalRecordById(recordId)
  if (!record) {
    showErrorPopup("Erro", "Registro não encontrado.")
    return
  }

  // Create print content
  const printContent = `
    <div class="print-content">
      <div class="print-header">
        <h1>GESTIFY - Registro Médico</h1>
        <div class="print-date">Impresso em: ${new Date().toLocaleDateString()}</div>
      </div>
      
      <div class="print-section">
        <h2>${record.title}</h2>
        <div class="print-meta">
          <p><strong>Data da Consulta:</strong> ${new Date(record.date).toLocaleDateString()}</p>
          <p><strong>Médico:</strong> Dr(a). ${record.doctorName}</p>
          <p><strong>Especialidade:</strong> ${getSpecialtyName(record.specialty)}</p>
          <p><strong>Tipo:</strong> ${record.type}</p>
          ${record.location ? `<p><strong>Local:</strong> ${record.location}</p>` : ""}
        </div>
      </div>
      
      <div class="print-section">
        <h3>Diagnóstico</h3>
        <p>${record.diagnosis}</p>
      </div>
      
      <div class="print-section">
        <h3>Observações Médicas</h3>
        <p>${record.notes}</p>
      </div>
      
      ${
        record.prescription
          ? `
        <div class="print-section">
          <h3>Prescrição</h3>
          <div class="prescription-print">
            <p>${record.prescription}</p>
          </div>
        </div>
      `
          : ""
      }
      
      ${
        record.exams && record.exams.length > 0
          ? `
        <div class="print-section">
          <h3>Exames</h3>
          <ul>
            ${record.exams.map((exam) => `<li>${exam}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      <div class="print-footer">
        <p>Este documento foi gerado automaticamente pelo sistema Gestify.</p>
      </div>
    </div>
  `

  // Create print window
  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Registro Médico - ${record.title}</title>
        <style>
          @media print {
            body { margin: 0; }
            .print-content { padding: 20px; font-family: Arial, sans-serif; }
            .print-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
            .print-header h1 { color: #2c5aa0; margin: 0; }
            .print-date { color: #666; margin-top: 10px; }
            .print-section { margin-bottom: 25px; }
            .print-section h2 { color: #2c5aa0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .print-section h3 { color: #2c5aa0; margin-bottom: 10px; }
            .print-meta p { margin: 5px 0; }
            .prescription-print { border: 2px dashed #2c5aa0; padding: 15px; background: #f9f9f9; }
            .print-footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
          }
          @media screen {
            body { font-family: Arial, sans-serif; padding: 20px; }
            .print-content { max-width: 800px; margin: 0 auto; }
            .print-header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
            .print-header h1 { color: #2c5aa0; margin: 0; }
            .print-date { color: #666; margin-top: 10px; }
            .print-section { margin-bottom: 25px; }
            .print-section h2 { color: #2c5aa0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .print-section h3 { color: #2c5aa0; margin-bottom: 10px; }
            .print-meta p { margin: 5px 0; }
            .prescription-print { border: 2px dashed #2c5aa0; padding: 15px; background: #f9f9f9; }
            .print-footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

// Profile Edit Functions
function loadEditProfile() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  document.getElementById("edit-profile-content").innerHTML = `
    <div class="edit-profile-form">
      <h2>Editar Perfil</h2>
      <form id="profile-form">
        <div class="profile-photo-section">
          <div class="current-photo">
            <img src="${currentUser.profilePicture || "/placeholder.svg?height=150&width=150"}" 
                 alt="Foto atual" id="profile-preview" class="profile-preview">
          </div>
          <div class="photo-upload">
            <label for="profile-picture" class="upload-label">
              <i class="fas fa-camera"></i>
              Alterar Foto
            </label>
            <input type="file" id="profile-picture" accept="image/*" style="display: none;">
            <small style="display: block; margin-top: 0.5rem; color: #666;">
              Formatos aceitos: JPG, PNG (máx. 5MB)
            </small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-name">Nome</label>
            <input type="text" id="edit-name" value="${currentUser.name}" required>
          </div>
          <div class="form-group">
            <label for="edit-surname">Sobrenome</label>
            <input type="text" id="edit-surname" value="${currentUser.surname}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="edit-phone">Telefone</label>
          <input type="tel" id="edit-phone" value="${currentUser.phone}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-email">E-mail</label>
          <input type="email" id="edit-email" value="${currentUser.email}" required>
        </div>
        
        ${
          currentUser.type === "doctor"
            ? `
          <div class="form-group">
            <label for="edit-crm">CRM</label>
            <input type="text" id="edit-crm" value="${currentUser.crm}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-specialty">Especialidade</label>
            <select id="edit-specialty" required>
              <option value="clinico-geral" ${currentUser.specialty === "clinico-geral" ? "selected" : ""}>Clínico Geral</option>
              <option value="cardiologia" ${currentUser.specialty === "cardiologia" ? "selected" : ""}>Cardiologia</option>
              <option value="dermatologia" ${currentUser.specialty === "dermatologia" ? "selected" : ""}>Dermatologia</option>
              <option value="pediatria" ${currentUser.specialty === "pediatria" ? "selected" : ""}>Pediatria</option>
              <option value="ginecologia" ${currentUser.specialty === "ginecologia" ? "selected" : ""}>Ginecologia</option>
              <option value="ortopedia" ${currentUser.specialty === "ortopedia" ? "selected" : ""}>Ortopedia</option>
              <option value="psiquiatria" ${currentUser.specialty === "psiquiatria" ? "selected" : ""}>Psiquiatria</option>
              <option value="neurologia" ${currentUser.specialty === "neurologia" ? "selected" : ""}>Neurologia</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-base-price">Preço Base da Consulta (R$)</label>
            <input type="number" id="edit-base-price" value="${currentUser.basePrice || 100}" min="50" max="1000" required>
          </div>
        `
            : ""
        }
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="showDashboard()">Cancelar</button>
          <button type="submit" class="btn-submit">Salvar Alterações</button>
        </div>
      </form>
    </div>
  `

  // Setup photo upload
  setupPhotoUpload()

  // Setup form submission
  document.getElementById("profile-form").onsubmit = (e) => {
    e.preventDefault()
    saveProfile()
  }
}

function setupPhotoUpload() {
  const fileInput = document.getElementById("profile-picture")
  const preview = document.getElementById("profile-preview")

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        showErrorPopup("Arquivo Inválido", "Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)")
        return
      }

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorPopup("Arquivo Muito Grande", "A imagem deve ter no máximo 5MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        preview.src = imageData
        // Armazenar os dados da imagem no elemento para uso posterior
        preview.dataset.imageData = imageData
        showSuccessPopup(
          "Imagem Carregada",
          "Foto carregada com sucesso! Clique em 'Salvar Alterações' para confirmar.",
        )
      }
      reader.onerror = () => {
        showErrorPopup("Erro no Upload", "Erro ao carregar a imagem. Tente novamente.")
      }
      reader.readAsDataURL(file)
    }
  })
}

function saveProfile() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const users = JSON.parse(localStorage.getItem("users")) || []

  // Get form data
  const updatedData = {
    name: document.getElementById("edit-name").value,
    surname: document.getElementById("edit-surname").value,
    phone: document.getElementById("edit-phone").value,
    email: document.getElementById("edit-email").value,
  }

  // Add doctor-specific fields
  if (currentUser.type === "doctor") {
    updatedData.crm = document.getElementById("edit-crm").value
    updatedData.specialty = document.getElementById("edit-specialty").value
    updatedData.basePrice = Number.parseInt(document.getElementById("edit-base-price").value)
  }

  // Handle profile picture
  const preview = document.getElementById("profile-preview")
  if (preview.dataset.imageData) {
    // Nova imagem foi carregada
    updatedData.profilePicture = preview.dataset.imageData
  } else if (preview.src && !preview.src.includes("placeholder.svg")) {
    // Manter imagem existente se não foi alterada
    updatedData.profilePicture = currentUser.profilePicture
  }

  // Validar campos obrigatórios
  if (!updatedData.name || !updatedData.surname || !updatedData.email) {
    showErrorPopup("Campos Obrigatórios", "Por favor, preencha todos os campos obrigatórios.")
    return
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(updatedData.email)) {
    showErrorPopup("Email Inválido", "Por favor, insira um email válido.")
    return
  }

  // Update user in users array
  const userIndex = users.findIndex((u) => u.id === currentUser.id)
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData }
    localStorage.setItem("users", JSON.stringify(users))

    // Update current user session
    const updatedUser = { ...currentUser, ...updatedData }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    showSuccessPopup("Perfil Atualizado", "Suas informações foram atualizadas com sucesso!")
    setTimeout(() => showDashboard(), 2000)
  } else {
    showErrorPopup("Erro", "Erro ao atualizar perfil. Tente novamente.")
  }
}

function updateProfile() {
  showEditProfile()
}

// Continue with existing functions...
function loadPatientAppointments() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const appointments = getAppointmentsForPatient(currentUser.id)

  const appointmentsList = document.getElementById("appointments-list")
  if (!appointmentsList) return

  if (appointments.length === 0) {
    appointmentsList.innerHTML = "<p>Você não tem consultas agendadas.</p>"
    return
  }

  appointmentsList.innerHTML = appointments
    .map(
      (appointment) => `
    <div class="appointment-card">
      <h4>${appointment.doctorName}</h4>
      <div class="appointment-info">
        <div><strong>Data:</strong> ${new Date(appointment.date).toLocaleDateString()}</div>
        <div><strong>Horário:</strong> ${appointment.time}</div>
        <div><strong>Tipo:</strong> ${appointment.type}</div>
        <div><strong>Status:</strong> <span class="appointment-status ${appointment.status}">${getStatusName(appointment.status)}</span></div>
      </div>
      ${
        appointment.status === "completed" && !hasRating(appointment.id)
          ? `<button class="btn-primary" onclick="showRating('${appointment.id}')">Avaliar Consulta</button>`
          : ""
      }
    </div>
  `,
    )
    .join("")
}

function loadMedicalHistory() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const medicalHistory = getMedicalHistoryForPatient(currentUser.id)

  const historyList = document.getElementById("medical-history-list")
  if (!historyList) return

  if (medicalHistory.length === 0) {
    historyList.innerHTML = "<p>Você ainda não possui registros no histórico médico.</p>"
    return
  }

  historyList.innerHTML = medicalHistory
    .map(
      (record) => `
      <div class="medical-record-card">
        <div class="record-header">
          <h4>${record.title}</h4>
          <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
        </div>
        <div class="record-info">
          <div><strong>Médico:</strong> ${record.doctorName}</div>
          <div><strong>Especialidade:</strong> ${getSpecialtyName(record.specialty)}</div>
          <div><strong>Tipo:</strong> ${record.type}</div>
        </div>
        <div class="record-details">
          <p><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
          <p><strong>Observações:</strong> ${record.notes}</p>
          ${record.prescription ? `<p><strong>Prescrição:</strong> ${record.prescription}</p>` : ""}
          ${record.examFiles && record.examFiles.length > 0 ? `<p><strong>Arquivos:</strong> ${record.examFiles.length} arquivo(s) anexado(s)</p>` : ""}
        </div>
        <button class="btn-primary" onclick="showRecordDetails('${record.id}')">Ver Detalhes</button>
      </div>
    `,
    )
    .join("")
}

function loadDoctorAppointments() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const appointments = getAppointmentsForDoctor(currentUser.id)

  const appointmentsList = document.getElementById("doctor-appointments-list")
  if (!appointmentsList) return

  if (appointments.length === 0) {
    appointmentsList.innerHTML = "<p>Você não tem consultas agendadas.</p>"
    return
  }

  appointmentsList.innerHTML = appointments
    .map(
      (appointment) => `
    <div class="appointment-card">
      <h4>${appointment.patientName}</h4>
      <div class="appointment-info">
        <div><strong>Data:</strong> ${new Date(appointment.date).toLocaleDateString()}</div>
        <div><strong>Horário:</strong> ${appointment.time}</div>
        <div><strong>Tipo:</strong> ${appointment.type}</div>
        <div><strong>Status:</strong> <span class="appointment-status ${appointment.status}">${getStatusName(appointment.status)}</span></div>
      </div>
      <div class="appointment-actions">
        ${
          appointment.status === "pending"
            ? `<button class="btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'confirmed')">Confirmar</button>
           <button class="btn-secondary" onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')">Cancelar</button>`
            : ""
        }
        ${
          appointment.status === "confirmed"
            ? `<button class="btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'completed')">Marcar como Concluída</button>`
            : ""
        }
        ${
          appointment.status === "completed" && !hasMedicalRecord(appointment.id)
            ? `<button class="btn-cta" onclick="showAddMedicalRecord('${appointment.id}')">Adicionar Registro Médico</button>`
            : ""
        }
      </div>
    </div>
  `,
    )
    .join("")
}

function updateAppointmentStatus(appointmentId, newStatus) {
  const appointments = JSON.parse(localStorage.getItem("appointments")) || []
  const appointmentIndex = appointments.findIndex((a) => a.id === appointmentId)

  if (appointmentIndex !== -1) {
    appointments[appointmentIndex].status = newStatus
    localStorage.setItem("appointments", JSON.stringify(appointments))
    loadDoctorAppointments()
    updateDoctorStats()

    // Create notification for status change
    const appointment = appointments[appointmentIndex]
    if (newStatus === "confirmed") {
      createNotification(
        appointment.patientId,
        "appointment",
        "Consulta Confirmada",
        `Sua consulta com Dr(a) ${appointment.doctorName} foi confirmada para ${new Date(appointment.date).toLocaleDateString()} às ${appointment.time}`,
        appointmentId,
      )
    }
  }
}

function hasMedicalRecord(appointmentId) {
  const medicalHistory = JSON.parse(localStorage.getItem("medicalHistory")) || []
  return medicalHistory.some((record) => record.appointmentId === appointmentId)
}

function showRecordDetails(recordId) {
  selectedHistoryId = recordId
  const record = getMedicalRecordById(recordId)

  if (!record) {
    showErrorPopup("Erro", "Registro não encontrado.")
    return
  }

  showPage("medical-record-details")

  document.getElementById("record-details-content").innerHTML = `
    <div class="medical-record-details">
      <h2>${record.title}</h2>
      <div class="record-meta">
        <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
        <span class="record-doctor">Dr(a). ${record.doctorName}</span>
      </div>
      
      <div class="record-section">
        <h3>Informações Gerais</h3>
        <div class="record-info-grid">
          <div class="record-info-item">
            <span class="info-label">Especialidade</span>
            <span class="info-value">${getSpecialtyName(record.specialty)}</span>
          </div>
          <div class="record-info-item">
            <span class="info-label">Tipo de Consulta</span>
            <span class="info-value">${record.type}</span>
          </div>
          <div class="record-info-item">
            <span class="info-label">Local</span>
            <span class="info-value">${record.location || "Não informado"}</span>
          </div>
        </div>
      </div>
      
      <div class="record-section">
        <h3>Diagnóstico</h3>
        <p class="record-text">${record.diagnosis}</p>
      </div>
      
      <div class="record-section">
        <h3>Observações Médicas</h3>
        <p class="record-text">${record.notes}</p>
      </div>
      
      ${
        record.prescription
          ? `
        <div class="record-section">
          <h3>Prescrição</h3>
          <div class="prescription-box">
            <i class="fas fa-prescription"></i>
            <p>${record.prescription}</p>
          </div>
        </div>
        `
          : ""
      }
      
      ${
        record.exams && record.exams.length > 0
          ? `
        <div class="record-section">
          <h3>Exames</h3>
          <ul class="exams-list">
            ${record.exams.map((exam) => `<li>${exam}</li>`).join("")}
          </ul>
        </div>
        `
          : ""
      }
      
      ${
        record.examFiles && record.examFiles.length > 0
          ? `
        <div class="record-section">
          <h3>Arquivos de Exames</h3>
          <div class="exam-files">
            ${record.examFiles
              .map(
                (file, index) => `
              <div class="exam-file">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="btn-secondary btn-small" onclick="downloadFile('${record.id}', ${index})">
                  <i class="fas fa-download"></i>
                </button>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        `
          : ""
      }
      
      <div class="record-actions">
        <button class="btn-secondary" onclick="showDashboard()">Voltar</button>
        <button class="btn-primary" onclick="printMedicalRecord('${record.id}')">
          <i class="fas fa-print"></i> Imprimir
        </button>
      </div>
    </div>
  `
}

function getFileIcon(fileType) {
  if (fileType.includes("pdf")) return "fa-file-pdf"
  if (fileType.includes("image")) return "fa-file-image"
  return "fa-file"
}

function downloadFile(recordId, fileIndex) {
  const record = getMedicalRecordById(recordId)
  if (!record || !record.examFiles || !record.examFiles[fileIndex]) {
    showErrorPopup("Erro", "Arquivo não encontrado.")
    return
  }

  const file = record.examFiles[fileIndex]
  const link = document.createElement("a")
  link.href = file.data
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Rating Functions
function setupRatingForm(appointmentId) {
  const appointment = getAppointmentById(appointmentId)
  if (!appointment) return

  document.getElementById("rating-doctor-info").innerHTML = `
    <h3>${appointment.doctorName}</h3>
    <p>Consulta realizada em ${new Date(appointment.date).toLocaleDateString()}</p>
  `

  // Setup star rating
  const stars = document.querySelectorAll(".star")
  const ratingInput = document.getElementById("rating-value")

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = Number.parseInt(star.dataset.rating)
      ratingInput.value = rating

      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add("active")
        } else {
          s.classList.remove("active")
        }
      })
    })
  })

  document.getElementById("rating-form").onsubmit = (e) => {
    e.preventDefault()
    submitRating(appointmentId)
  }
}

function submitRating(appointmentId) {
  const appointment = getAppointmentById(appointmentId)
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  const ratingData = {
    id: Date.now().toString(),
    appointmentId: appointmentId,
    doctorId: appointment.doctorId,
    patientId: currentUser.id,
    patientName: `${currentUser.name} ${currentUser.surname}`,
    rating: Number.parseInt(document.getElementById("rating-value").value),
    comment: document.getElementById("rating-comment").value,
    createdAt: new Date().toISOString(),
  }

  const ratings = JSON.parse(localStorage.getItem("ratings")) || []
  ratings.push(ratingData)
  localStorage.setItem("ratings", JSON.stringify(ratings))

  showSuccessPopup("Avaliação Enviada", "Obrigado pelo seu feedback! Sua avaliação foi registrada.")
  setTimeout(() => showDashboard(), 2000)
}

// Doctor Statistics
function updateDoctorStats() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const stats = getDoctorStats(currentUser.id)

  document.getElementById("today-appointments").textContent = stats.todayAppointments
  document.getElementById("total-patients").textContent = stats.totalPatients
  document.getElementById("average-rating").textContent = `${stats.averageRating.toFixed(1)} ⭐`
  document.getElementById("total-ratings").textContent = stats.totalRatings
}

function getDoctorStats(doctorId) {
  const appointments = getAppointmentsForDoctor(doctorId)
  const ratings = getRatingsForDoctor(doctorId)
  const today = new Date().toISOString().split("T")[0]

  const todayAppointments = appointments.filter((a) => a.date === today && a.status === "confirmed").length
  const totalPatients = new Set(appointments.map((a) => a.patientId)).size
  const totalRatings = ratings.length
  const averageRating = totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0
  const totalAppointments = appointments.filter((a) => a.status === "completed").length

  return {
    todayAppointments,
    totalPatients,
    totalRatings,
    averageRating,
    totalAppointments,
  }
}

function getMedicalHistoryForPatient(patientId) {
  const medicalHistory = JSON.parse(localStorage.getItem("medicalHistory")) || []
  return medicalHistory
    .filter((record) => record.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

function getMedicalRecordById(recordId) {
  const medicalHistory = JSON.parse(localStorage.getItem("medicalHistory")) || []
  return medicalHistory.find((record) => record.id === recordId)
}

// Data Helper Functions
function getDoctors() {
  const users = JSON.parse(localStorage.getItem("users")) || []
  return users
    .filter((user) => user.type === "doctor")
    .map((doctor) => ({
      ...doctor,
      basePrice: doctor.basePrice || Math.floor(Math.random() * 100) + 80,
      location: doctor.location || "São Paulo, SP",
    }))
}

function getAppointmentsForPatient(patientId) {
  const appointments = JSON.parse(localStorage.getItem("appointments")) || []
  return appointments.filter((a) => a.patientId === patientId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

function getAppointmentsForDoctor(doctorId) {
  const appointments = JSON.parse(localStorage.getItem("appointments")) || []
  return appointments.filter((a) => a.doctorId === doctorId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

function getAppointmentById(appointmentId) {
  const appointments = JSON.parse(localStorage.getItem("appointments")) || []
  return appointments.find((a) => a.id === appointmentId)
}

function getRatingsForDoctor(doctorId) {
  const ratings = JSON.parse(localStorage.getItem("ratings")) || []
  return ratings.filter((r) => r.doctorId === doctorId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function hasRating(appointmentId) {
  const ratings = JSON.parse(localStorage.getItem("ratings")) || []
  return ratings.some((r) => r.appointmentId === appointmentId)
}

// Utility Functions
function getSpecialtyName(specialty) {
  const specialties = {
    "clinico-geral": "Clínico Geral",
    cardiologia: "Cardiologia",
    dermatologia: "Dermatologia",
    pediatria: "Pediatria",
    ginecologia: "Ginecologia",
    ortopedia: "Ortopedia",
    psiquiatria: "Psiquiatria",
    neurologia: "Neurologia",
  }
  return specialties[specialty] || specialty
}

function getStatusName(status) {
  const statuses = {
    pending: "Pendente",
    confirmed: "Confirmada",
    completed: "Concluída",
    cancelled: "Cancelada",
  }
  return statuses[status] || status
}

// Dashboard Functions
function showMyAppointments() {
  const appointmentsSection = document.getElementById("my-appointments")
  appointmentsSection.style.display = appointmentsSection.style.display === "none" ? "block" : "none"
}

function showMedicalHistory() {
  const historySection = document.getElementById("medical-history")
  historySection.style.display = historySection.style.display === "none" ? "block" : "none"

  if (historySection.style.display === "block") {
    loadMedicalHistory()
  }
}

function showDoctorAppointments() {
  const appointmentsSection = document.getElementById("doctor-appointments")
  appointmentsSection.style.display = appointmentsSection.style.display === "none" ? "block" : "none"
}

function showDoctorRatings() {
  const ratingsSection = document.getElementById("doctor-ratings")
  ratingsSection.style.display = ratingsSection.style.display === "none" ? "block" : "none"

  if (ratingsSection.style.display === "block") {
    loadDoctorRatings()
  }
}

function loadDoctorRatings() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const ratings = getRatingsForDoctor(currentUser.id)

  const ratingsList = document.getElementById("doctor-ratings-list")
  if (!ratingsList) return

  if (ratings.length === 0) {
    ratingsList.innerHTML = "<p>Você ainda não recebeu avaliações.</p>"
    return
  }

  ratingsList.innerHTML = ratings
    .map(
      (rating) => `
    <div class="rating-card">
      <h4>${rating.patientName}</h4>
      <div class="rating-info">
        <div><strong>Avaliação:</strong> ${"⭐".repeat(rating.rating)}</div>
        <div><strong>Data:</strong> ${new Date(rating.createdAt).toLocaleDateString()}</div>
      </div>
      <p><strong>Comentário:</strong> ${rating.comment}</p>
    </div>
  `,
    )
    .join("")
}

// Authentication Functions (keeping existing ones)
function login(email, password) {
  const users = JSON.parse(localStorage.getItem("users")) || []
  const user = users.find((u) => (u.email === email || u.cpf === email) && u.password === password)

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
    return { success: true, user }
  } else {
    return { success: false, message: "Credenciais inválidas" }
  }
}

function register(userData) {
  const users = JSON.parse(localStorage.getItem("users")) || []
  const existingUser = users.find((u) => u.email === userData.email || u.cpf === userData.cpf)

  if (existingUser) {
    return { success: false, message: "Usuário já existe com este email ou CPF" }
  }

  const newUser = {
    id: Date.now().toString(),
    ...userData,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))

  return { success: true, user: newUser }
}

function logout() {
  localStorage.removeItem("currentUser")
  showLanding()
}

// Form Validation (keeping existing)
function validateForm(formData, type) {
  const errors = []

  if (!formData.name || formData.name.length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres")
  }

  if (!formData.surname || formData.surname.length < 2) {
    errors.push("Sobrenome deve ter pelo menos 2 caracteres")
  }

  if (!validateCPF(formData.cpf)) {
    errors.push("CPF inválido")
  }

  if (!validateEmail(formData.email)) {
    errors.push("Email inválido")
  }

  if (formData.password.length < 6) {
    errors.push("Senha deve ter pelo menos 6 caracteres")
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push("Senhas não coincidem")
  }

  if (type === "doctor") {
    if (!formData.crm || formData.crm.length < 5) {
      errors.push("CRM inválido")
    }

    if (!formData.specialty) {
      errors.push("Especialidade é obrigatória")
    }
  }

  return errors
}

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, "")
  return cpf.length === 11 && /^\d{11}$/.test(cpf)
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Input Formatting (keeping existing)
function formatCPF(input) {
  let value = input.value.replace(/\D/g, "")
  value = value.replace(/(\d{3})(\d)/, "$1.$2")
  value = value.replace(/(\d{3})(\d)/, "$1.$2")
  value = value.replace(/(\d{3})-(\d)(\d{4})/, "$1-$2")
  input.value = value
}

function formatPhone(input) {
  let value = input.value.replace(/\D/g, "")
  value = value.replace(/(\d{2})(\d)/, "($1) $2")
  value = value.replace(/(\d{4})(\d)/, "$1-$2")
  value = value.replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
  input.value = value
}

// Initialize sample data
function initializeSampleData() {
  const sampleUsers = [
    {
      id: "1",
      type: "doctor",
      name: "Ricardo",
      surname: "Marques",
      cpf: "123.456.789-01",
      crm: "CRM/SP 123456",
      specialty: "clinico-geral",
      phone: "(11) 99999-9999",
      email: "ricardo.marques@email.com",
      password: "123456",
      basePrice: 100,
      location: "São Paulo, SP",
      profilePicture: "/placeholder.svg?height=150&width=150",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      type: "doctor",
      name: "Cruzia",
      surname: "Santos",
      cpf: "987.654.321-01",
      crm: "CRM/RJ 654321",
      specialty: "cardiologia",
      phone: "(21) 88888-8888",
      email: "cruzia.santos@email.com",
      password: "123456",
      basePrice: 150,
      location: "Rio de Janeiro, RJ",
      profilePicture: "/placeholder.svg?height=150&width=150",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      type: "patient",
      name: "João",
      surname: "Silva",
      cpf: "111.222.333-44",
      phone: "(11) 77777-7777",
      email: "joao.silva@email.com",
      password: "123456",
      createdAt: new Date().toISOString(),
    },
  ]

  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(sampleUsers))
  }

  const sampleMedicalHistory = [
    {
      id: "1",
      patientId: "3",
      doctorId: "1",
      appointmentId: "sample1",
      doctorName: "Ricardo Marques",
      specialty: "clinico-geral",
      title: "Consulta de Rotina",
      date: new Date(2023, 5, 15).toISOString(),
      type: "Presencial",
      diagnosis: "Paciente saudável. Exames de rotina dentro da normalidade.",
      notes: "Paciente relatou leve dor de cabeça ocasional. Recomendado acompanhamento da pressão arterial.",
      prescription: "Paracetamol 500mg em caso de dor de cabeça. 1 comprimido a cada 6 horas se necessário.",
      location: "Clínica Central - São Paulo",
      exams: ["Hemograma Completo", "Glicemia em Jejum"],
      examFiles: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      patientId: "3",
      doctorId: "2",
      appointmentId: "sample2",
      doctorName: "Cruzia Santos",
      specialty: "cardiologia",
      title: "Avaliação Cardiológica",
      date: new Date(2023, 3, 10).toISOString(),
      type: "Presencial",
      diagnosis: "Pressão arterial levemente elevada. Sem outras alterações significativas.",
      notes: "Paciente deve monitorar pressão arterial regularmente e retornar em 6 meses para reavaliação.",
      prescription: "Losartana 50mg, 1 comprimido pela manhã.",
      location: "Hospital Cardio - Rio de Janeiro",
      exams: ["Eletrocardiograma", "Ecocardiograma"],
      examFiles: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      patientId: "3",
      doctorId: "1",
      appointmentId: "sample3",
      doctorName: "Ricardo Marques",
      specialty: "clinico-geral",
      title: "Consulta por Gripe",
      date: new Date(2023, 1, 5).toISOString(),
      type: "Teleconsulta",
      diagnosis: "Síndrome gripal. Sem sinais de complicação.",
      notes: "Paciente apresentou febre, dor de garganta e congestão nasal há 3 dias.",
      prescription: "Dipirona 500mg a cada 6 horas se febre. Descongestionante nasal 8/8h por 5 dias.",
      location: null,
      exams: [],
      examFiles: [],
      createdAt: new Date().toISOString(),
    },
  ]

  if (!localStorage.getItem("medicalHistory")) {
    localStorage.setItem("medicalHistory", JSON.stringify(sampleMedicalHistory))
  }

  // Initialize notifications if not exists
  if (!localStorage.getItem("notifications")) {
    localStorage.setItem("notifications", JSON.stringify([]))
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  initializeSampleData()
  updateLogoNavigation() // Initialize logo navigation

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (currentUser) {
    showDashboard()
  }

  // Configurar o botão de histórico médico
  const historyButton = document.querySelector(".action-btn:nth-child(3)")
  if (historyButton) {
    historyButton.onclick = showMedicalHistory
  }

  // Login form
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("login-email").value
      const password = document.getElementById("login-password").value
      const result = login(email, password)

      if (result.success) {
        showSuccessPopup("Login Realizado", `Bem-vindo(a), ${result.user.name}!`)
        setTimeout(() => showDashboard(), 2000)
      } else {
        showErrorPopup("Erro no Login", result.message)
      }
    })
  }

  // Patient registration form
  const patientRegisterForm = document.getElementById("patient-register-form")
  if (patientRegisterForm) {
    patientRegisterForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = {
        type: "patient",
        name: document.getElementById("patient-name").value,
        surname: document.getElementById("patient-surname").value,
        cpf: document.getElementById("patient-cpf").value,
        phone: document.getElementById("patient-phone").value,
        email: document.getElementById("patient-email").value,
        password: document.getElementById("patient-password").value,
        confirmPassword: document.getElementById("patient-confirm-password").value,
      }

      const errors = validateForm(formData, "patient")
      if (errors.length > 0) {
        showErrorPopup("Erro no Cadastro", errors.join("\n"))
        return
      }

      const result = register(formData)
      if (result.success) {
        showSuccessPopup("Cadastro Realizado", "Sua conta foi criada com sucesso!")
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        setTimeout(() => showDashboard(), 2000)
      } else {
        showErrorPopup("Erro no Cadastro", result.message)
      }
    })
  }

  // Doctor registration form
  const doctorRegisterForm = document.getElementById("doctor-register-form")
  if (doctorRegisterForm) {
    doctorRegisterForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = {
        type: "doctor",
        name: document.getElementById("doctor-name").value,
        surname: document.getElementById("doctor-surname").value,
        cpf: document.getElementById("doctor-cpf").value,
        crm: document.getElementById("doctor-crm").value,
        specialty: document.getElementById("doctor-specialty").value,
        phone: document.getElementById("doctor-phone").value,
        email: document.getElementById("doctor-email").value,
        password: document.getElementById("doctor-password").value,
        confirmPassword: document.getElementById("doctor-confirm-password").value,
      }

      const errors = validateForm(formData, "doctor")
      if (errors.length > 0) {
        showErrorPopup("Erro no Cadastro", errors.join("\n"))
        return
      }

      const result = register(formData)
      if (result.success) {
        showSuccessPopup("Cadastro Realizado", "Sua conta médica foi criada com sucesso!")
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        setTimeout(() => showDashboard(), 2000)
      } else {
        showErrorPopup("Erro no Cadastro", result.message)
      }
    })
  }

  // Input formatting
  const patientCpf = document.getElementById("patient-cpf")
  if (patientCpf) {
    patientCpf.addEventListener("input", function () {
      formatCPF(this)
    })
  }

  const doctorCpf = document.getElementById("doctor-cpf")
  if (doctorCpf) {
    doctorCpf.addEventListener("input", function () {
      formatCPF(this)
    })
  }

  const patientPhone = document.getElementById("patient-phone")
  if (patientPhone) {
    patientPhone.addEventListener("input", function () {
      formatPhone(this)
    })
  }

  const doctorPhone = document.getElementById("doctor-phone")
  if (doctorPhone) {
    doctorPhone.addEventListener("input", function () {
      formatPhone(this)
    })
  }

  // Update profile form
  const updateProfileForm = document.getElementById("update-profile-form")
  if (updateProfileForm) {
    updateProfileForm.addEventListener("submit", (e) => {
      e.preventDefault()
      updateProfile()
    })
  }

  // Profile picture upload
  const profilePictureUpload = document.getElementById("profile-picture")
  if (profilePictureUpload) {
    profilePictureUpload.addEventListener("change", () => {
      uploadProfilePicture()
    })
  }
})

function uploadProfilePicture() {
  // Placeholder function for profile picture upload
  showInfoPopup("Em Construção", "Funcionalidade de upload de foto de perfil ainda não implementada.")
}
