import * as ts from 'typescript';

const isClassDecoratorImplementation = (str: string): boolean => {
  return (
    str.includes('NestControllerInterface') || str.includes('ControllerShape')
  );
};

const isNestControllerContract = (str: string): boolean => {
  return (
    str.includes('initNestServer') || str.includes('nestControllerContract')
  );
};

const isTsRestParameterDecoratorName = (str: string): boolean => {
  return str.includes('ApiDecorator') || str.includes('TsRestRequest');
};

const isTsRestMethodDecorator = (str: string): boolean => {
  return str.includes('Api') || str.includes('TsRest');
};

const getTransformer = (output: 'single-handler' | 'multiple-handler') => {
  const transform = (context: ts.TransformationContext) => {
    const { factory } = context;

    let contractIdentifier: ts.Identifier | undefined;

    return (rootNode: ts.Node) => {
      function visit(node: ts.Node): ts.Node {
        // Look for the variable assignment to 'nestControllerContract' and store the contract Identifier
        if (ts.isVariableStatement(node)) {
          const declaration = node.declarationList.declarations[0];

          if (
            declaration &&
            declaration.initializer &&
            ts.isCallExpression(declaration.initializer)
          ) {
            if (
              isNestControllerContract(
                declaration.initializer.expression.getText()
              )
            ) {
              console.log(
                'transform - found the nestControllerContract function, saving contract name and deleting line'
              );

              contractIdentifier = declaration.initializer
                .arguments[0] as ts.Identifier;
              return factory.createEmptyStatement();
            }
          }
        }

        if (ts.isClassDeclaration(node)) {
          console.log('transform - found class, trying to transform');

          const newMembers = transformMethods(node.members);

          if (newMembers) {
            const newHeritageClauses = node.heritageClauses?.filter(
              (heritageClause) =>
                !heritageClause.types.some((type) =>
                  isClassDecoratorImplementation(type.expression.getText())
                )
            );

            return factory.updateClassDeclaration(
              node,
              node.modifiers,
              node.name,
              node.typeParameters,
              newHeritageClauses,
              newMembers
            );
          }
        }

        if (
          ts.isImportDeclaration(node) &&
          node.moduleSpecifier.getText() === "'@ts-rest/nest'"
        ) {
          if (
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings)
          ) {
            const tsRestHandlerFunctionImportSpecifier =
              factory.createImportSpecifier(
                false,
                undefined,
                factory.createIdentifier('tsRestHandler')
              );

            const tsRestHandlerDecoratorImportSpecifier =
              factory.createImportSpecifier(
                false,
                undefined,
                factory.createIdentifier('TsRestHandler')
              );

            const newNamedImports = factory.updateNamedImports(
              node.importClause.namedBindings,
              [
                // ...node.importClause.namedBindings.elements,
                tsRestHandlerFunctionImportSpecifier,
                tsRestHandlerDecoratorImportSpecifier,
              ]
            );

            const newImportClause = factory.createImportClause(
              false,
              undefined,
              newNamedImports
            );

            return factory.createImportDeclaration(
              node.decorators,
              node.modifiers,
              newImportClause,
              node.moduleSpecifier
            );
          }
        }
        return ts.visitEachChild(node, visit, context);
      }

      function transformMethods(members: ts.NodeArray<ts.ClassElement>) {
        const constructor = members.find(ts.isConstructorDeclaration) as
          | ts.ConstructorDeclaration
          | undefined;

        // Split methods into ones that have the TsRest decorator and ones that do not
        const tsRestMethods: ts.MethodDeclaration[] = [];
        const nonTsRestMethods: ts.MethodDeclaration[] = [];

        members.forEach((member) => {
          if (ts.isMethodDeclaration(member)) {
            const hasTsRestDecorator =
              (ts.canHaveDecorators(member) &&
                ts
                  .getDecorators(member)
                  ?.some((decorator) =>
                    isTsRestMethodDecorator(decorator.expression.getText())
                  )) ??
              false;

            if (hasTsRestDecorator) {
              tsRestMethods.push(member);
            } else {
              nonTsRestMethods.push(member);
            }
          }
        });

        // Preserve property declarations
        const propertyDeclarations = members.filter(
          ts.isPropertyDeclaration
        ) as ts.PropertyDeclaration[];

        if (!constructor || !tsRestMethods.length || !contractIdentifier) {
          return;
        }

        console.log('transform - trying to generate the handler function');

        const singleHandlers = tsRestMethods.map((controllerMethod) => {
          const contractAccess = factory.createPropertyAccessExpression(
            contractIdentifier!,
            factory.createIdentifier(controllerMethod.name.getText())
          );

          const decorator = factory.createDecorator(
            factory.createCallExpression(
              factory.createIdentifier('TsRestHandler'),
              undefined,
              [contractAccess]
            )
          );

          const paramsWithoutTsRestDecorators =
            controllerMethod.parameters.filter(
              (param) =>
                !ts
                  .getDecorators(param)
                  ?.some((decorator) =>
                    isTsRestParameterDecoratorName(
                      decorator.expression.getText()
                    )
                  )
            );

          const originalTsRestParamDecorator = controllerMethod.parameters.find(
            (param) =>
              ts
                .getDecorators(param)
                ?.some((decorator) =>
                  isTsRestParameterDecoratorName(decorator.expression.getText())
                )
          );

          // Create a new parameter based on the old one, but without the decorator and type.
          const newParam = originalTsRestParamDecorator
            ? factory.createParameterDeclaration(
                undefined, // No decorators.
                undefined, // No modifiers.
                undefined, // No dotDotDotToken.
                originalTsRestParamDecorator.name, // Keep the old parameter's name.
                undefined, // No questionToken.
                undefined // No type.
              )
            : undefined;

          const handler = factory.createMethodDeclaration(
            [decorator, ...(controllerMethod.decorators ?? [])],
            undefined,
            undefined,
            controllerMethod.name,
            undefined,
            undefined,
            paramsWithoutTsRestDecorators,
            controllerMethod.type,
            factory.createBlock([
              factory.createReturnStatement(
                factory.createCallExpression(
                  factory.createIdentifier('tsRestHandler'),
                  undefined,
                  [
                    contractAccess,
                    factory.createArrowFunction(
                      [factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
                      undefined,
                      [...(newParam ? [newParam] : [])],
                      undefined,
                      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                      controllerMethod.body || factory.createBlock([])
                    ),
                  ]
                )
              ),
            ])
          );

          return handler;
        });

        const decorator = factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier('TsRestHandler'),
            undefined,
            [contractIdentifier]
          )
        );

        const combinedHandlerFunction = factory.createMethodDeclaration(
          [decorator],
          undefined,
          undefined,
          'handler',
          undefined,
          undefined,
          [],
          undefined,
          factory.createBlock([
            factory.createReturnStatement(
              factory.createCallExpression(
                factory.createIdentifier('tsRestHandler'),
                undefined,
                [
                  contractIdentifier,
                  factory.createObjectLiteralExpression(
                    tsRestMethods.map((controllerMethod) => {
                      const headersMap: { [key: string]: string } = {};

                      // Find parameters with the @Headers decorator
                      controllerMethod.parameters.forEach((param) => {
                        if (
                          ts.canHaveDecorators(param) &&
                          ts
                            .getDecorators(param)
                            ?.some((decorator) =>
                              decorator.expression.getText().includes('Headers')
                            )
                        ) {
                          const paramName = param.name.getText();

                          // Extract the header name from the decorator
                          const decorator = ts
                            .getDecorators(param)
                            ?.find((decorator) =>
                              decorator.expression.getText().includes('Headers')
                            );

                          let headerName: string | undefined;
                          if (
                            decorator &&
                            ts.isCallExpression(decorator.expression)
                          ) {
                            const args = decorator.expression.arguments;
                            if (
                              args &&
                              args.length > 0 &&
                              ts.isStringLiteral(args[0])
                            ) {
                              headerName = args[0].text;
                            }
                          }

                          if (headerName) {
                            // Store the header name and parameter name in the headers map
                            headersMap[headerName] = paramName;
                          }
                        }
                      });

                      console.log(
                        'transform - trying to find the parameter with the @TsRestRequest decorator'
                      );

                      // Find the parameter with the @TsRestRequest() decorator.
                      const tsRestRequestParam =
                        controllerMethod.parameters.find(
                          (param) =>
                            ts.canHaveDecorators(param) &&
                            ts
                              .getDecorators(param)
                              ?.some((decorator) =>
                                isTsRestParameterDecoratorName(
                                  decorator.expression.getText()
                                )
                              )
                        );

                      console.log(
                        `transform - found @Headers with values`,
                        headersMap
                      );

                      const headersObjectLiteral =
                        factory.createObjectBindingPattern(
                          Object.keys(headersMap).map((key) =>
                            factory.createBindingElement(
                              undefined,
                              factory.createStringLiteral(key.toLowerCase()),
                              factory.createIdentifier(headersMap[key]),
                              undefined
                            )
                          )
                        );

                      let nameUpdatedWithHeaders;

                      if (
                        tsRestRequestParam &&
                        ts.isObjectBindingPattern(tsRestRequestParam.name) &&
                        Object.keys(headersMap).length > 0
                      ) {
                        nameUpdatedWithHeaders =
                          factory.createObjectBindingPattern([
                            ...tsRestRequestParam.name.elements,
                            factory.createBindingElement(
                              undefined,
                              'headers',
                              headersObjectLiteral
                            ),
                          ]);
                      } else {
                        nameUpdatedWithHeaders = tsRestRequestParam?.name;
                      }

                      // Create a new parameter based on the old one, but without the decorator and type.
                      const newParam = tsRestRequestParam
                        ? factory.createParameterDeclaration(
                            undefined, // No decorators.
                            undefined, // No modifiers.
                            undefined, // No dotDotDotToken.
                            nameUpdatedWithHeaders, // Keep the old parameter's name.
                            undefined, // No questionToken.
                            undefined // No type.
                          )
                        : undefined;

                      return factory.createPropertyAssignment(
                        controllerMethod.name,
                        factory.createArrowFunction(
                          [factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
                          undefined,
                          newParam ? [newParam] : [], // Use the new parameter.
                          undefined,
                          factory.createToken(
                            ts.SyntaxKind.EqualsGreaterThanToken
                          ),
                          controllerMethod.body || factory.createBlock([])
                        )
                      );
                    })
                  ),
                  // ...handlerBody,
                ]
              )
            ),
          ])
        );

        const newMembers = factory.createNodeArray([
          constructor,
          ...nonTsRestMethods, // Add non-TsRest methods to the top level of the class
          ...(output === 'single-handler'
            ? singleHandlers
            : [combinedHandlerFunction]),
          ...propertyDeclarations,
        ]);

        return newMembers;
      }

      return ts.visitNode(rootNode, visit);
    };
  };

  return transform;
};

function removeAsConst(context: ts.TransformationContext) {
  const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (
      ts.isAsExpression(node) &&
      ts.isTypeReferenceNode(node.type) &&
      node.type.typeName.getText() === 'const'
    ) {
      return node.expression;
    }
    return ts.visitEachChild(node, visitor, context);
  };
  return (rootNode: ts.Node) => ts.visitNode(rootNode, visitor);
}

function removeNestRequestShapesTypes(context: ts.TransformationContext) {
  const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (ts.isTypeAliasDeclaration(node)) {
      if (ts.isTypeReferenceNode(node.type)) {
        const typeName = node.type.typeName.getText();
        if (
          typeName === 'NestRequestShapes' ||
          typeName === 'NestResponseShapes'
        ) {
          // Remove this type alias declaration by returning undefined
          return undefined;
        }
      }
    }

    // For all other nodes, keep them as they are
    return ts.visitEachChild(node, visitor, context);
  };

  return (rootNode: ts.Node) => ts.visitNode(rootNode, visitor);
}

export const transformLegacyNestController = (
  oldCode: string,
  output: 'single-handler' | 'multiple-handler'
) => {
  const sourceFile = ts.createSourceFile(
    'old.ts',
    oldCode,
    ts.ScriptTarget.ES2015,
    true
  );

  console.log('transformer - starting transformation');

  const result = ts.transform(sourceFile, [
    getTransformer(output),
    removeAsConst,
    removeNestRequestShapesTypes,
  ]);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  let newCode = '';
  result.transformed.forEach((file) => {
    newCode += printer.printNode(ts.EmitHint.Unspecified, file, sourceFile);
  });

  return newCode;
};
