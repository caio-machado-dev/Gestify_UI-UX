// Global variables
let selectedDoctorId = null
let selectedAppointmentId = null

// Page Management
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
  document.getElementById(pageId).classList.add("active")
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

function showDashboard() {
  showPage("dashboard")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  if (currentUser) {
    document.getElementById("user-welcome").textContent = `Olá, ${currentUser.name}!`

    if (currentUser.type === "patient") {
      document.getElementById("patient-dashboard").style.display = "block"
      document.getElementById("doctor-dashboard").style.display = "none"
      loadPatientAppointments()
    } else if (currentUser.type === "doctor") {
      document.getElementById("patient-dashboard").style.display = "none"
      document.getElementById("doctor-dashboard").style.display = "block"
      updateDoctorStats()
      loadDoctorAppointments()
    }
  }
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
    alert("Por favor, selecione data e horário para a consulta.")
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
      alert("Não é possível agendar consultas para horários que já passaram ou com menos de 1 hora de antecedência.")
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

  alert("Consulta agendada com sucesso!")
  showDashboard()
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
      const reader = new FileReader()
      reader.onload = (e) => {
        preview.src = e.target.result
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
  if (preview.src && !preview.src.includes("placeholder.svg")) {
    updatedData.profilePicture = preview.src
  }

  // Update user in users array
  const userIndex = users.findIndex((u) => u.id === currentUser.id)
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData }
    localStorage.setItem("users", JSON.stringify(users))

    // Update current user session
    const updatedUser = { ...currentUser, ...updatedData }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    alert("Perfil atualizado com sucesso!")
    showDashboard()
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
  }
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

  alert("Avaliação enviada com sucesso!")
  showDashboard()
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
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  initializeSampleData()

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (currentUser) {
    showDashboard()
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
        showDashboard()
      } else {
        alert(result.message)
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
        alert("Erros encontrados:\n" + errors.join("\n"))
        return
      }

      const result = register(formData)
      if (result.success) {
        alert("Cadastro realizado com sucesso!")
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        showDashboard()
      } else {
        alert(result.message)
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
        alert("Erros encontrados:\n" + errors.join("\n"))
        return
      }

      const result = register(formData)
      if (result.success) {
        alert("Cadastro realizado com sucesso!")
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        showDashboard()
      } else {
        alert(result.message)
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
  alert("Profile picture upload functionality is not implemented yet.")
}
