(function () {
  function getElements() {
    return {
      quizViewButton: document.getElementById("quizViewButton"),
      listViewButton: document.getElementById("listViewButton"),
      quizView: document.getElementById("quizView"),
      listView: document.getElementById("listView"),
      quizViewToggle: document.getElementById("quizViewToggle"),
      listViewToggle: document.getElementById("listViewToggle")
    };
  }

  function setStudyView(viewName) {
    const elements = getElements();
    const isListView = viewName === "list";

    if (!elements.quizViewButton || !elements.listViewButton || !elements.quizView || !elements.listView) {
      return;
    }

    if (elements.quizViewToggle && elements.listViewToggle) {
      elements.quizViewToggle.checked = !isListView;
      elements.listViewToggle.checked = isListView;
    }

    elements.quizViewButton.classList.toggle("active", !isListView);
    elements.listViewButton.classList.toggle("active", isListView);
    elements.quizViewButton.setAttribute("aria-pressed", String(!isListView));
    elements.listViewButton.setAttribute("aria-pressed", String(isListView));

    document.dispatchEvent(new CustomEvent("study-view-change", {
      detail: { view: isListView ? "list" : "quiz" }
    }));
  }

  window.setStudyView = setStudyView;

  document.addEventListener("DOMContentLoaded", () => {
    const elements = getElements();
    elements.quizViewButton && elements.quizViewButton.addEventListener("click", () => setStudyView("quiz"));
    elements.listViewButton && elements.listViewButton.addEventListener("click", () => setStudyView("list"));
    elements.quizViewToggle && elements.quizViewToggle.addEventListener("change", () => setStudyView("quiz"));
    elements.listViewToggle && elements.listViewToggle.addEventListener("change", () => setStudyView("list"));
  });
})();
