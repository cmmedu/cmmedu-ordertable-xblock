# EOL Order XBlock

EOL Order XBlock is an educational tool designed to integrate into [edX courses](https://www.edx.org/). This tool allows students to order elements in a specific sequence, which is useful for assessing their understanding of processes, steps, or concepts that must follow a particular order.

Right now this Xblock is only aviable in spanish.

## Use Cases

- Ordering the steps of a scientific process
- Sequencing historical events in chronological order
- Organizing system components in the correct order
- Ordering the steps of an algorithm or procedure

![EOL Order XBlock Usage Example](docs/images/example.png)

## Installation

The installation method for EOL Order XBlock may vary depending on your Open edX setup. You are encouraged to consult the [official documentation](https://edx.readthedocs.io/projects/edx-installing-configuring-and-running/en/latest/configuration/install_xblock.html) for detailed guidance.

To activate EOL Order XBlock in a course, it needs to be added to the list of advanced modules. This can be done in the course's advanced settings by entering `eolorder` as the module name.

## How to Use

To incorporate an EOL Order XBlock into your course:

1. Go to a specific unit in Studio
2. Select "Advanced" from the options
3. Choose "EOL Order XBlock"

This will add an empty XBlock to the unit. Note that this XBlock will not appear in the LMS until it has been properly configured.

### Content Configuration

The EOL Order XBlock allows you to configure:

- **Title**: Specifies the module's title
- **Description**: Provides instructions or context for the activity
- **Elements to Order**: List of elements that students must order
- **Correct Order**: Defines the correct order of elements
- **Feedback**: Custom messages for correct and incorrect answers

![XBlock Configuration](docs/images/configuration.png)

### Additional Options

- **Allow Retries**: Maximum number of attempts allowed
- **Show Feedback**: Option to display feedback after each attempt
- **Scoring**: Configuration of points for correct answers
- **Time Limit**: Set a time limit to complete the activity

## Scoring

The EOL Order XBlock assigns scores based on:
- Correct order of all elements
- Incorrect (wrong order)

## License

This project is licensed under [AGPL-3.0](LICENSE).

## Support

To report issues or request new features, please create an issue in the project repository. 