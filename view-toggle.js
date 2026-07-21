(function () {
  function getElements() {
    return {
      quizViewButton: document.getElementById("quizViewButton"),
      listViewButton: document.getElementById("listViewButton"),
      quizView: document.getElementById("quizView"),
      listView: document.getElementById("listView")
    };
  }

  function setStudyView(viewName) {
    const elements = getElements();
    const isListView = viewName === "list";

    if (!elements.quizViewButton || !elements.listViewButton || !elements.quizView || !elements.listView) {
      return;
    }

    elements.quizView.classList.toggle("hidden", isListView);
    elements.listView.classList.toggle("hidden", !isListView);
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
  });
})();
