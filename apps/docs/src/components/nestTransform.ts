import * as ts from 'typescript';

function transform(context: ts.TransformationContext) {
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
            declaration.initializer.expression.getText() ===
            'nestControllerContract'
          ) {
            contractIdentifier = declaration.initializer
              .arguments[0] as ts.Identifier;
          }
        }

        if (
          declaration &&
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer)
        ) {
          if (
            declaration.initializer.expression.getText() ===
            'nestControllerContract'
          ) {
            return factory.createEmptyStatement();
          }
        }
      }

      if (ts.isClassDeclaration(node)) {
        const newMembers = transformMethods(node.members);

        if (newMembers) {
          const newHeritageClauses = node.heritageClauses?.filter(
            (heritageClause) =>
              !heritageClause.types.some(
                (type) =>
                  type.expression.getText() === 'NestControllerInterface'
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
      const controllerMethods = members.filter(ts.isMethodDeclaration) as
        | ts.MethodDeclaration[]
        | undefined;

      if (!constructor || !controllerMethods || !contractIdentifier) {
        return;
      }

      const decorator = factory.createDecorator(
        factory.createCallExpression(
          factory.createIdentifier('TsRestHandler'),
          undefined,
          [contractIdentifier]
        )
      );

      const handlerFunction = factory.createMethodDeclaration(
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
                  controllerMethods.map((controllerMethod) => {
                    // Find the parameter with the @TsRestRequest() decorator.
                    const tsRestRequestParam = controllerMethod.parameters.find(
                      (param) =>
                        ts.canHaveDecorators(param) &&
                        ts
                          .getDecorators(param)
                          ?.some((decorator) =>
                            decorator.expression
                              .getText()
                              .includes('TsRestRequest')
                          )
                    );

                    // Create a new parameter based on the old one, but without the decorator and type.
                    const newParam = tsRestRequestParam
                      ? factory.createParameterDeclaration(
                          undefined, // No decorators.
                          undefined, // No modifiers.
                          undefined, // No dotDotDotToken.
                          tsRestRequestParam.name, // Keep the old parameter's name.
                          undefined, // No questionToken.
                          undefined, // No type.
                          undefined // No initializer.
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
        handlerFunction,
      ]);

      return newMembers;
    }

    return ts.visitNode(rootNode, visit);
  };
}

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

export const transformLegacyNestController = (oldCode: string) => {
  const sourceFile = ts.createSourceFile(
    'old.ts',
    oldCode,
    ts.ScriptTarget.ES2015,
    true
  );

  const result = ts.transform(sourceFile, [
    transform,
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
