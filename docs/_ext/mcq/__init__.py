def setup(app):
    from .mcq import setup as _setup
    return _setup(app)
