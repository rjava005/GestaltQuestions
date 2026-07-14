import logging
import os


# Create the logger
logger = logging.getLogger(__name__)
logger.setLevel(int(os.getenv("LOGLEVEL", logging.INFO)))
logger.propagate = False


# Formatiting
formatter = logging.Formatter(
    r"%(asctime)s - %(levelname)-7s in_test=%(in_test)s %(threadName)-12s [%(filename)s:%(lineno)s - %(funcName)s()] - %(message)s"
)


## Define the streaming
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)


if __name__ == "__main__":
    logger.info("Info logging test")
    logger.warning("Warning logging test")
    logger.error("Error logging test")
    logger.exception(Exception("Exception logging test"))
