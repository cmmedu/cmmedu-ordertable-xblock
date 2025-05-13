# CMM Order XBlock

CMM Order XBlock is an educational tool designed to integrate into [edX courses](https://www.edx.org/). This tool allows students to order elements in a specific sequence, which is useful for assessing their understanding of processes, steps, or concepts that must follow a particular order.

Right now this Xblock is only aviable in spanish.


![CMM Order XBlock Usage Example](cmmorder/static/images/example.png)

## Installation

The installation method for CMM Order XBlock may vary depending on your Open edX setup. You are encouraged to consult the [official documentation](https://edx.readthedocs.io/projects/edx-installing-configuring-and-running/en/latest/configuration/install_xblock.html) for detailed guidance.

To activate CMM Order XBlock in a course, it needs to be added to the list of advanced modules. This can be done in the course's advanced settings by entering `cmmorder` as the module name.

## How to Use

- Create a list on studio
- Define the corrects orders
- Create the disordered list that student will see

### Content Configuration

The CMM Order XBlock allows you to configure:

- **Title**: Specifies the module's title
- **Description**: Provides instructions or context for the activity
- **Elements to Order**: List of elements that students must order
- **Correct Order**: Defines the correct order of elements
- **Feedback**: show the ordered table

![XBlock Configuration](cmmorder/static/images/example-studio.png)

## Use Cases

- Ordering the steps of a scientific process
- Sequencing historical events in chronological order
- Organizing system components in the correct order
- Ordering the steps of an algorithm or procedure

## Scoring

The CMM Order XBlock assigns scores based on:
- Correct order of all elements (allow more than one correct answer)
- Incorrect, wrong order of at least one element

## License

This project is licensed under [AGPL-3.0](LICENSE).

## Support

To report issues or request new features, please create an issue in the project repository. 