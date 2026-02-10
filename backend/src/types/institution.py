from enum import Enum


# Defines the institution that they belong to
class ValidInstitutions(str, Enum):
    UCR = "University of California, Riverside"
    CPP = "California State Polytechnic University, Pomona"
    NORCO = "Norco College"
