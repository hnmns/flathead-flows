import pandas as pd
from pathlib import Path
from IPython.display import display


DATE_FORMAT = '%Y-%m-%d'


def display_cols(df):
    '''Shorthand to print a dataframe with many columns so they don't show up as "..."'''
    with pd.option_context(
        # 'display.min_rows', num_rows,
        # 'display.max_rows', num_rows,
        'display.max_columns', None,
        'display.width', 1000
    ):
        display(df)


def find_most_recent_filename(dir: str) -> str:
    '''Given a folder `dir`, return name of most recently created file in `dir`.'''
    directory = Path(dir)
    most_recent_filename = max(
        (f for f in directory.iterdir() if f.is_file()), 
        key=lambda p: p.stat().st_birthtime
    )

    return most_recent_filename