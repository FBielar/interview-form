const params = new URLSearchParams(window.location.search);
const interviewId = params.get("id");

async function loadQuestion() {
  const res = await fetch(`/question/${interviewId}`);
  const data = await res.json();

  if (data.done) {
    document.body.innerHTML = "<h2>Interview completed.</h2>";
    return;
  }

  document.getElementById("question").innerText = data.question;
}

async function submitAnswer() {
  const answer = document.getElementById("answer").value;

  await fetch(`/answer/${interviewId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer })
  });

  document.getElementById("answer").value = "";
  loadQuestion();
}

loadQuestion();