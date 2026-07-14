import contextvars
import logging
import os

in_test_ctx = contextvars.ContextVar("in_test", default=False)


# Define a class for Capturing Test Logs
class TestFilter(logging.Filter):
    def filter(self, record) -> bool:
        record.in_test = in_test_ctx.get()
        return True


# Create the logger
log_level = int(os.getenv("LOGLEVEL", logging.INFO))
logger = logging.getLogger(__name__)
logger.setLevel(log_level)
logger.propagate = False


# Formatiting
formatter = logging.Formatter(
    r"%(asctime)s - %(levelname)-7s in_test=%(in_test)s %(threadName)-12s [%(filename)s:%(lineno)s - %(funcName)s()] - %(message)s"
)


## Define the streaming
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)


# Add a filter to inject testing
filter = TestFilter()
logger.addFilter(filter)


if __name__ == "__main__":
    logger.info("Info logging test")
    logger.warning("Warning logging test")
    logger.error("Error logging test")
    logger.exception(Exception("Exception logging test"))
    logger.info(f"This is the log level {log_level}")
