import {AST_NODE_TYPES} from "@typescript-eslint/utils";
import {PropertyDefinition} from "@typescript-eslint/types/dist/ast-spec";
import * as classValidator from "class-validator";
import {getPropertiesDefinitions} from "../../utils/ast";
import {createRule} from "../../utils/createRule";

const CLASS_VALIDATOR_DECORATOR_NAMES = new Set(
    Object.keys(classValidator as object)
);

const rule = createRule({
    name: "all-properties-are-whitelisted",
    meta: {
        docs: {
            description: "Enforce all properties are whitelisted",
            recommended: "error",
            requiresTypeChecking: false,
        },
        messages: {
            "missing-property-decorator":
                "Property has no class-validator decorator (use @Allow() if you don't need a validation)",
        },
        type: "problem",
        schema: {},
    },
    defaultOptions: [],
    create: function (context) {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ClassDeclaration(node) {
                const withDecorator: PropertyDefinition[] = [];
                const withoutDecorator: PropertyDefinition[] = [];
                const propertyDefinitions = getPropertiesDefinitions(node);
                for (const propertyDefinition of propertyDefinitions) {
                    const hasDecorator = propertyDefinition.decorators?.some(
                        (decorator) =>
                            decorator.expression.type ===
                                AST_NODE_TYPES.CallExpression &&
                            decorator.expression.callee.type ===
                                AST_NODE_TYPES.Identifier &&
                            CLASS_VALIDATOR_DECORATOR_NAMES.has(
                                decorator.expression.callee.name
                            )
                    );
                    if (hasDecorator) {
                        withDecorator.push(propertyDefinition);
                    } else {
                        withoutDecorator.push(propertyDefinition);
                    }
                }
                if (withDecorator.length > 0 && withoutDecorator.length > 0) {
                    for (const element of withoutDecorator) {
                        context.report({
                            node: element,
                            messageId: "missing-property-decorator",
                        });
                    }
                }
            },
        };
    },
});

export default rule;
