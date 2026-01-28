import pytest
from calculator import Calculator

def test_add():
    calc = Calculator()
    assert calc.add(2, 3) == 5
    assert calc.add(-1, 1) == 0
    assert calc.add(-1, -1) == -2

def test_subtract():
    calc = Calculator()
    assert calc.subtract(5, 3) == 2
    assert calc.subtract(1, 1) == 0
    assert calc.subtract(0, 5) == -5

def test_multiply():
    calc = Calculator()
    assert calc.multiply(2, 3) == 6
    assert calc.multiply(-1, 1) == -1
    assert calc.multiply(-1, -1) == 1

def test_divide():
    calc = Calculator()
    assert calc.divide(10, 2) == 5
    assert calc.divide(5, 2) == 2.5
    with pytest.raises(ValueError):
        calc.divide(1, 0)
