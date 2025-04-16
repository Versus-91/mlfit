from py.helpers.commnad_write import CommandWriter
import io
import textwrap


est = CommandWriter()
z = [1, 2, 3]
t = f"""{z}"""

k = est.get_command(
    {"explain": True, "target": 'ocean_proximity'})
clean_code_str = textwrap.dedent(k)
with open('a.py', 'w') as f:
    f.write(clean_code_str)
