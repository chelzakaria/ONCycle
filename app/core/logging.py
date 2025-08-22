"""Logging configuration for the ONCycle API"""

import os
import logging
import sys
from core.config import settings

# Global LOGGER instance
LOGGER = None


def setup_logging():
    """Setup logging configuration"""
    global LOGGER

    if LOGGER is not None:
        return LOGGER

    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    formatter = logging.Formatter(settings.LOG_FORMAT)
    LOGGER = logging.getLogger("ONCycle")
    LOGGER.setLevel(log_level)

    if LOGGER.handlers:
        return LOGGER

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    LOGGER.addHandler(console_handler)

    file_handler = logging.FileHandler(os.path.join(log_dir, "oncycle.log"))
    file_handler.setFormatter(formatter)
    LOGGER.addHandler(file_handler)

    return LOGGER


def get_logger():
    """Get the configured LOGGER instance"""
    global LOGGER
    if LOGGER is None:
        LOGGER = setup_logging()
    return LOGGER
