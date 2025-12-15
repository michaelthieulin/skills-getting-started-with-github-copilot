document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Remove previously added options (keep placeholder)
      activitySelect.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        // Build participants HTML with delete icon
        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length === 0) {
          participantsHtml = '<p class="participants-empty">No participants yet</p>';
        } else {
          participantsHtml = `<ul class="participants">${participants.map(p => `
            <li style="display: flex; align-items: center; justify-content: space-between;">
              <span>${p}</span>
              <span class="delete-participant" title="Supprimer" data-activity="${name}" data-email="${p}" style="cursor:pointer;color:#c62828;font-size:1.2em;margin-left:10px;">&#128465;</span>
            </li>`).join("")}</ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants</strong></p>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Ajout gestionnaire pour suppression participant
        activityCard.addEventListener("click", async (e) => {
          if (e.target.classList.contains("delete-participant")) {
            const activityName = e.target.getAttribute("data-activity");
            const email = e.target.getAttribute("data-email");
            if (confirm(`Désinscrire ${email} de ${activityName} ?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: "POST"
                });
                const result = await response.json();
                if (response.ok) {
                  messageDiv.textContent = result.message || "Participant supprimé.";
                  messageDiv.className = "success";
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Erreur lors de la suppression.";
                  messageDiv.className = "error";
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
              } catch (error) {
                messageDiv.textContent = "Erreur réseau lors de la suppression.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            }
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Met à jour la liste après inscription
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
