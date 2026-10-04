from pathlib import Path

# Root folder
ROOT = Path("docs")

# Files to create
FILES = [
    "_ext/quizgroup/__init__.py",
    "_ext/quizgroup/directive.py",
    "_ext/quizgroup/static/quizgroup.css",
    "_ext/quizgroup/static/index.js",
    "_ext/quizgroup/static/QuizGroupController.js",
    "_ext/quizgroup/static/utils/helpers.js",
    "_ext/quizgroup/static/adapters/BaseAdapter.js",
    "_ext/quizgroup/static/adapters/MultichoiceAdapter.js",
    "_ext/quizgroup/static/adapters/ClozeAdapter.js",
    "_ext/quizgroup/static/adapters/GapfillAdapter.js",
    "_ext/quizgroup/static/adapters/ClassifyingAdapter.js",
    "_ext/quizgroup/static/adapters/FillinAdapter.js",
    "_ext/quizgroup/static/adapters/index.js",
]


def create_structure():
    for relative_file in FILES:
        file_path = ROOT / relative_file

        # Create parent directories
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Create empty file if it doesn't already exist
        file_path.touch(exist_ok=True)

        print(f"Created: {file_path}")


if __name__ == "__main__":
    create_structure()
    print("\nQuizGroup folder structure created successfully.")