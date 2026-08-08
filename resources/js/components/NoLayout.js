import React, { Component } from "react";
class NoLayout extends Component {
	constructor(props) {
		super(props);

	}

	render() {
		return (
			<React.Fragment>
				<main>
					{this.props.children}
				</main>
			</React.Fragment>
		);
	}
}


export default NoLayout;
